import fcntl
import json
import os
import shutil
import time

import pika
import requests

import config
import executor
import ingest
import keyframe
import video_msg
from control import ControlChannel
from control_poll import ControlPoller
from storage import StorageClient

"""
Execution of a task.run message (ADD T-02, T-03): download the inputs, run the
plan in one FFmpeg invocation, probe the result, extract the thumbnail and
frame 0, make the preview copy when the plan asks for it, upload, reply.
Replies go to video_project_queue, matched by taskId; progress goes straight to
video_ws_queue at least once per second (NFR-009). Everything runs on the main
thread, on the worker's single connection.
"""

OPERATION = 'task.run'
WS_QUEUE = 'video_ws_queue'
# The loop turns every ~0.5 s; sending at most every 0.5 s keeps every gap
# under 1 s (NFR-009: at least once per second).
PROGRESS_EVERY_S = 0.5

# A running task holds an flock on this file of its work directory. A directory
# whose lock can be taken has no live owner: it was left by a delivery killed
# with its worker. The flock dies with the process, on any replica sharing the
# video_tmp volume. Ingestion directories (B001) have no lock and are not touched.
LOCK_NAME = '.task.lock'


def hold_lock(work_dir):
    fd = os.open(os.path.join(work_dir, LOCK_NAME), os.O_CREAT | os.O_RDWR)
    fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    return fd


def remove_if_unowned(path):
    lock = os.path.join(path, LOCK_NAME)
    try:
        fd = os.open(lock, os.O_RDWR)
    except OSError:
        return False
    try:
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        os.close(fd)
        return False
    shutil.rmtree(path, ignore_errors=True)
    os.close(fd)
    return True


def sweep_leftovers(root):
    """Task directories without a live owner (NFR-007, ERROR-003)."""
    if not os.path.isdir(root):
        return []
    return [name for name in sorted(os.listdir(root))
            if os.path.isdir(os.path.join(root, name)) and remove_if_unowned(os.path.join(root, name))]


class TaskRunner:
    def __init__(self, rabbit, log, redact, clock=time.monotonic):
        self._rabbit = rabbit
        self._log = log
        self._redact = redact
        self._clock = clock
        self._control = ControlChannel(rabbit._connection, on_cancel=self._on_cancel)
        self._control_poller = ControlPoller(self._control)
        self._storage = StorageClient(self._tick)
        self._reporter = None
        self._running = None
        # Leftovers of deliveries killed with a previous worker, whose
        # cancellation may have been published while no worker was listening.
        removed = sweep_leftovers(config.TMP_ROOT)
        if removed:
            log('info', 'video.task.leftovers_removed', taskIds=removed)

    def _on_cancel(self, task_id):
        """A task closed by the projects service (cancelled, dead-lettered or
        stuck) that this replica is not running: remove what a killed earlier
        delivery may have left in video_tmp (NFR-007, ERROR-003)."""
        if task_id != self._running:
            remove_if_unowned(os.path.join(config.TMP_ROOT, os.path.basename(task_id)))

    # ---- loop helpers ---------------------------------------------------

    def _wait(self, seconds):
        """Heartbeats and control messages (cancellations) for up to `seconds`."""
        self._rabbit._connection.process_data_events(time_limit=seconds)
        self._control_poller.poll()

    def _tick(self):
        """Called between transfer blocks: heartbeats, progress cadence, cancel."""
        self._wait(0)
        if self._reporter:
            self._reporter.report()
            if self._reporter.task_id in self._control.cancelled:
                raise executor.Cancelled()

    def _publish(self, routing_key, message):
        self._rabbit._channel.basic_publish(
            exchange='picturas',
            routing_key=routing_key,
            body=json.dumps(message),
            properties=pika.BasicProperties(delivery_mode=2, content_type='application/json'),
        )

    def _reply(self, request, started_at, status, output=None, error=None, redelivered=None):
        reply = video_msg.build_reply(request, started_at, status, output=output, error=error)
        if status == 'completed' and getattr(self, '_video_mode', None) is not None:
            reply['metadata']['videoMode'] = self._video_mode
        reply['taskId'] = request.get('taskId')
        if redelivered is not None:
            reply['metadata']['redelivered'] = redelivered
        self._publish(config.REPLIES_QUEUE, reply)

    # ---- one delivery ---------------------------------------------------

    def run(self, channel, method, request):
        self._video_mode = None
        task_id = str(request.get('taskId', ''))
        correlation_id = request.get('correlationId')
        started_at = video_msg.now()
        work_dir = os.path.join(config.TMP_ROOT, os.path.basename(task_id) or 'unknown')

        if task_id in self._control.cancelled:
            # Cancelled while it waited in the queue (ADD T-03).
            self._log('info', 'video.task.discarded', correlationId=correlation_id, taskId=task_id)
            self._reply(request, started_at, 'cancelled')
            channel.basic_ack(delivery_tag=method.delivery_tag)
            return

        # A redelivered message starts again from scratch, writing to the same keys.
        shutil.rmtree(work_dir, ignore_errors=True)
        os.makedirs(work_dir, exist_ok=True)
        lock_fd = hold_lock(work_dir)
        self._log('info', 'video.task.start', correlationId=correlation_id, taskId=task_id,
                  redelivered=method.redelivered)
        self._reply(request, started_at, 'started', redelivered=method.redelivered)

        self._reporter = ProgressReporter(self._publish, request, self._clock)
        self._running = task_id
        try:
            output = self._execute(request, work_dir)
            self._reply(request, started_at, 'completed', output=output)
            status = 'completed'
        except executor.Cancelled:
            self._reply(request, started_at, 'cancelled')
            status = 'cancelled'
        except requests.HTTPError as exc:
            missing = exc.response is not None and exc.response.status_code == 404
            cause = self._redact(exc)
            self._log('error', 'video.task.failed', correlationId=correlation_id, taskId=task_id, cause=cause)
            code = 'RESOURCE_UNAVAILABLE' if missing else 'PROCESSING_ERROR'
            self._reply(request, started_at, 'failed', error={'code': code, 'message': cause})
            status = 'failed'
        except Exception as exc:  # noqa: BLE001 - any failure becomes an error reply
            cause = self._redact(exc)
            self._log('error', 'video.task.failed', correlationId=correlation_id, taskId=task_id, cause=cause)
            self._reply(request, started_at, 'failed', error={'code': 'PROCESSING_ERROR', 'message': cause})
            status = 'failed'
        finally:
            self._reporter = None
            self._running = None
            self._video_mode = None
            shutil.rmtree(work_dir, ignore_errors=True)
            os.close(lock_fd)

        self._log('info', 'video.task.done', correlationId=correlation_id, taskId=task_id, status=status)
        # Ack only after the reply is published (ADD T-03).
        channel.basic_ack(delivery_tag=method.delivery_tag)

    def _execute(self, request, work_dir):
        plan = request['plan']
        task_id = str(request['taskId'])
        pump = self._tick

        input_paths = []
        for index, item in enumerate(plan['inputs']):
            path = os.path.join(work_dir, f'input{index}')
            self._storage.download(item['source'], path)
            input_paths.append(path)

        if any(step['operation'] in ('trim', 'remove_audio', 'speed') for step in plan['steps']):
            plan, self._video_mode = keyframe.resolve_keyframe_copy(plan, input_paths[0], pump)
            alternative = request['plan'].get('keyframeCopy')
            if alternative:
                self._log('info', 'video.task.keyframe', correlationId=request.get('correlationId'),
                          taskId=task_id, atMs=alternative['atMs'],
                          keyframeMs=alternative['atMs'] if self._video_mode == 'copy' else None,
                          videoMode=self._video_mode)

        container = plan['output']['container']
        result_path = os.path.join(work_dir, f'result.{container}')
        cmd = executor.build_command(plan, input_paths, result_path)
        cmd = keyframe.insert_input_options(cmd, plan)
        # One encoding invocation per task, visible in the logs (NFR-013).
        self._log('info', 'video.task.ffmpeg', correlationId=request.get('correlationId'),
                  taskId=task_id, command=' '.join(cmd))
        executor.run(
            cmd, work_dir, plan.get('expectedDurationMs'),
            wait=self._wait,
            on_progress=self._reporter.update,
            is_cancelled=lambda: task_id in self._control.cancelled,
        )
        self._reporter.update(99)

        # Metadata of the result always come from the real file (ADD T-02).
        probed = ingest.probe(result_path, pump)
        thumb_path = os.path.join(work_dir, 'thumb.jpg')
        frame_path = os.path.join(work_dir, 'frame0.jpg')
        thumbnail = plan['thumbnail']
        ingest.thumbnail(result_path, thumb_path, thumbnail['atMs'], thumbnail['maxWidth'], pump)
        ingest.first_frame(result_path, frame_path, plan['firstFrameMaxWidth'], pump)

        preview_path = None
        preview_plan = self._preview_plan(plan.get('preview'), probed)
        if preview_plan:
            preview_path = os.path.join(work_dir, 'preview.mp4')
            ingest.preview(result_path, preview_path, preview_plan, pump)

        # Write URLs are requested only now, after FFmpeg ends (ADD T-08).
        targets = plan['targets']
        original = targets['original']
        keys = {
            'original': self._storage.upload(original, result_path, original['contentType']),
            'thumb': self._storage.upload(targets['thumb'], thumb_path, 'image/jpeg'),
            'firstFrame': self._storage.upload(targets['firstFrame'], frame_path, 'image/jpeg'),
        }
        if preview_path:
            keys['preview'] = self._storage.upload(targets['preview'], preview_path, 'video/mp4')

        return {'meta': probed['meta'], 'stream': probed['stream'], 'keys': keys,
                'previewMade': preview_path is not None}

    @staticmethod
    def _preview_plan(preview, probed):
        """The plan gives both preview plans and the browser profile as data
        (ADD T-06); the result's FFprobe picks one. No rules of its own here."""
        if not preview:
            return None
        profile = preview['browserProfile']
        compatible = (probed['meta']['videoCodec'] == profile['videoCodec']
                      and probed['stream']['pixFmt'] == profile['pixFmt'])
        return preview['whenCompatible'] if compatible else preview['whenIncompatible']


class ProgressReporter:
    """Publishes video-task-update about twice per second, repeating the last
    value when FFmpeg has nothing new, and never going down within a delivery."""

    def __init__(self, publish, request, clock):
        self._publish = publish
        self._clock = clock
        self.task_id = str(request['taskId'])
        self._event = {
            'event': 'video-task-update',
            'correlationId': request.get('correlationId'),
            'userId': request.get('userId'),
            'projectId': request.get('projectId'),
            'taskId': self.task_id,
            'status': 'processing',
        }
        self._total = max(1, int(request.get('totalSteps') or 1))
        self._progress = 0
        self._last = None

    def update(self, progress):
        self._progress = max(self._progress, int(progress))
        self.report()

    def report(self):
        now = self._clock()
        if self._last is not None and now - self._last < PROGRESS_EVERY_S:
            return
        self._last = now
        step = min(self._total, self._progress * self._total // 100 + 1)  # D-40
        self._publish(WS_QUEUE, {**self._event, 'step': step, 'totalSteps': self._total,
                                 'progress': self._progress})
