import datetime
import json
import os
import re
import shutil

import pytz

import utils.env as env

import config
import ingest
import video_msg
from storage import StorageClient
from video_rabbit import VideoRabbitMQ


_URL_QUERY = re.compile(r'(https?://[^\s?]+)\?\S*')


def redact(text):
    """Drops query strings from URLs: presigned URLs carry their signature
    there, and it must not reach logs or replies (ADD T-10)."""
    return _URL_QUERY.sub(r'\1?<redacted>', str(text))


def log(level, event, **fields):
    line = {
        'level': level,
        'event': event,
        'service': 'video_worker',
        'time': datetime.datetime.now(pytz.utc).isoformat(),
        **fields,
    }
    print(json.dumps(line), flush=True)


class VideoWorker:
    """Single video worker (ADD T-02). This bolt runs the ingestion only; the
    chain executor is built by B003 by addition (D-02, D-08)."""

    def __init__(self):
        self._rabbit = VideoRabbitMQ(env.RABBITMQ_HOST, env.RABBITMQ_PORT,
                                     env.RABBITMQ_USERNAME, env.RABBITMQ_PASSWORD)
        self._rabbit.declare_queues()
        self._storage = StorageClient(self._rabbit.pump)

    def run(self):
        log('info', 'video.worker.started')
        self._rabbit.consume(self.on_message)

    def on_message(self, channel, method, properties, body):
        try:
            request = json.loads(body.decode())
        except ValueError:
            log('error', 'video.worker.invalid_message')
            channel.basic_ack(delivery_tag=method.delivery_tag)
            return

        reply = self.handle(request, redelivered=method.redelivered)

        # Ack only after the reply is published (ADD T-03).
        self._rabbit.publish_reply(reply)
        channel.basic_ack(delivery_tag=method.delivery_tag)

    def handle(self, request, redelivered=False):
        started_at = video_msg.now()
        video_id = str(request.get('videoId', ''))
        correlation_id = request.get('correlationId')
        operation = request.get('operation')
        work_dir = os.path.join(config.TMP_ROOT, os.path.basename(video_id) or 'unknown')

        # A redelivered message starts again from scratch.
        shutil.rmtree(work_dir, ignore_errors=True)
        os.makedirs(work_dir, exist_ok=True)
        log('info', 'video.worker.start', correlationId=correlation_id, videoId=video_id,
            operation=operation, redelivered=redelivered)

        try:
            source_path = os.path.join(work_dir, 'source')
            if operation == 'ingest.probe':
                self._storage.download(request['source'], source_path)
                result = ingest.probe(source_path, self._rabbit.pump)
                reply = video_msg.success(request, started_at, result)
            elif operation == 'ingest.derive':
                self._storage.download(request['source'], source_path)
                reply = self.derive(request, started_at, source_path, work_dir)
            else:
                reply = video_msg.failure(request, started_at, 'PROCESSING_ERROR',
                                          f'unknown operation {operation}')
        except ingest.CorruptedFile as exc:
            cause = redact(exc)
            log('error', 'video.worker.corrupted', correlationId=correlation_id, videoId=video_id, cause=cause)
            reply = video_msg.failure(request, started_at, 'CORRUPTED_FILE', cause)
        except Exception as exc:  # noqa: BLE001 - any failure becomes an error reply
            cause = redact(exc)
            log('error', 'video.worker.failed', correlationId=correlation_id, videoId=video_id, cause=cause)
            reply = video_msg.failure(request, started_at, 'PROCESSING_ERROR', cause)
        finally:
            shutil.rmtree(work_dir, ignore_errors=True)

        log('info', 'video.worker.done', correlationId=correlation_id, videoId=video_id,
            operation=operation, status=reply['status'])
        return reply

    def derive(self, request, started_at, source_path, work_dir):
        plan = request['plan']
        targets = request['targets']
        pump = self._rabbit.pump

        thumb_path = os.path.join(work_dir, 'thumb.jpg')
        frame_path = os.path.join(work_dir, 'frame0.jpg')
        ingest.thumbnail(source_path, thumb_path, plan['thumbnailAtMs'], plan['thumbnailMaxWidth'], pump)
        ingest.first_frame(source_path, frame_path, plan['firstFrameMaxWidth'], pump)

        preview_path = None
        if plan.get('preview'):
            preview_path = os.path.join(work_dir, 'preview.mp4')
            ingest.preview(source_path, preview_path, plan['preview'], pump)

        # Write URLs are requested only now, after FFmpeg ends (ADD T-08).
        output = {
            'thumbKey': self._storage.upload(targets['thumb'], thumb_path, 'image/jpeg'),
            'firstFrameKey': self._storage.upload(targets['firstFrame'], frame_path, 'image/jpeg'),
        }
        if preview_path:
            output['previewKey'] = self._storage.upload(targets['preview'], preview_path, 'video/mp4')

        return video_msg.success(request, started_at, output, preview_requested=bool(plan.get('preview')))


if __name__ == '__main__':
    VideoWorker().run()
