"""Unit tests of the chain executor of B003 (ADD T-02, T-03), with the real
FFmpeg 5.1 of the worker image:

  docker run --rm -v "$PWD/Tools/video:/src:ro" -v "$PWD/Tools/utils:/utils:ro" -w /src \\
    -e PYTHONPATH=/src:/ -e VIDEO_TEST_OPERATIONS=1 picturas-video_worker \\
    python -m unittest tests/test_task.py
"""
import json
import ast
import os
import shutil
import subprocess
import tempfile
import time
import unittest

os.environ.setdefault('VIDEO_TEST_OPERATIONS', '1')

import control  # noqa: E402
import executor  # noqa: E402
import ingest  # noqa: E402
import ops  # noqa: E402
import task  # noqa: E402

HAS_FFMPEG = shutil.which('ffmpeg') is not None


def make_video(path, *args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y'] + list(args) + [path], check=True)


def probe(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-print_format', 'json', '-show_format',
                          '-show_streams', path], check=True, capture_output=True).stdout
    return ingest.parse_probe(json.loads(out))


def ffmpeg_running(marker):
    """The image has no pgrep: look for the process in /proc."""
    for pid in filter(str.isdigit, os.listdir('/proc')):
        try:
            with open(f'/proc/{pid}/cmdline', 'rb') as f:
                cmdline = f.read().replace(b'\0', b' ').decode(errors='replace')
        except OSError:
            continue
        if cmdline.startswith('ffmpeg') and marker in cmdline:
            return True
    return False


def encode_plan(audio=True, steps=1, expected_ms=10_000, container='mp4'):
    return {
        'inputs': [{'videoId': 'v1', 'container': 'mp4', 'source': {}}],
        'steps': [{'operation': 'test_reencode', 'version': 1, 'parameters': {}}] * steps,
        'output': {
            'container': container,
            'video': {'mode': 'encode', 'codec': 'libx264', 'preset': 'veryfast', 'crf': 23,
                      'pixFmt': 'yuv420p', 'evenCrop': True},
            'audio': ({'mode': 'encode', 'codec': 'aac', 'bitrate': '128k'} if audio else {'mode': 'none'}),
            'faststart': True,
            'genpts': False,
        },
        'expectedDurationMs': expected_ms,
        'thumbnail': {'atMs': 1000, 'maxWidth': 320},
        'firstFrameMaxWidth': 1280,
        'preview': None,
        'targets': {
            'original': {'userId': 'u', 'projectId': 'p', 'stage': 'video_out', 'name': 't1.mp4',
                         'contentType': 'video/mp4'},
            'thumb': {'userId': 'u', 'projectId': 'p', 'stage': 'video_thumb', 'name': 't1.thumb.jpg'},
            'firstFrame': {'userId': 'u', 'projectId': 'p', 'stage': 'video_thumb', 'name': 't1.frame0.jpg'},
        },
    }


class BuildCommandTest(unittest.TestCase):
    def test_encode_plan_single_filter_complex_and_default_encoding(self):
        cmd = executor.build_command(encode_plan(steps=4), ['in0'], 'out.mp4')
        # One FFmpeg invocation with one filtergraph for any number of steps (NFR-013).
        self.assertEqual(cmd.count('-filter_complex'), 1)
        graph = cmd[cmd.index('-filter_complex') + 1]
        self.assertEqual(graph, '[0:V:0]crop=trunc(iw/2)*2:trunc(ih/2)*2[v];[0:a:0]anull[a]')
        joined = ' '.join(cmd)
        for part in ['-map [v]', '-map [a]', '-sn -dn', '-c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p',
                     '-c:a aac -b:a 128k', '-movflags +faststart', '-progress pipe:1']:
            self.assertIn(part, joined)

    def test_no_audio_and_copy(self):
        plan = encode_plan(audio=False)
        cmd = ' '.join(executor.build_command(plan, ['in0'], 'out.mp4'))
        self.assertNotIn('[a]', cmd)
        self.assertNotIn('-c:a', cmd)

        plan['output']['video'] = {'mode': 'copy'}
        plan['output']['audio'] = {'mode': 'copy'}
        plan['output']['genpts'] = True
        cmd = executor.build_command(plan, ['in0'], 'out.mp4')
        self.assertNotIn('-filter_complex', cmd)
        joined = ' '.join(cmd)
        self.assertIn('-fflags +genpts -i in0', joined)
        self.assertIn('-map 0:V:0 -map 0:a:0', joined)
        self.assertIn('-c:v copy -c:a copy', joined)

    def test_unknown_operation_is_an_error(self):
        plan = encode_plan()
        plan['steps'] = [{'operation': 'nope', 'version': 1}]
        with self.assertRaises(KeyError):
            executor.build_command(plan, ['in0'], 'out.mp4')


class ProgressTest(unittest.TestCase):
    def test_parser_reads_out_time_us_and_ignores_na(self):
        parser = executor.ProgressParser()
        parser.feed(b'frame=1\nout_time_us=N/A\nout_time_us=1500')
        self.assertEqual(parser.out_time_us, 0)
        parser.feed(b'000\nprogress=continue\n')
        self.assertEqual(parser.out_time_us, 1_500_000)
        parser.feed(b'out_time_us=1000000\n')  # never goes down
        self.assertEqual(parser.out_time_us, 1_500_000)

    def test_percent_is_capped_at_99(self):
        self.assertEqual(executor.percent(0, 10_000), 0)
        self.assertEqual(executor.percent(5_000_000, 10_000), 50)
        self.assertEqual(executor.percent(20_000_000, 10_000), 99)
        self.assertEqual(executor.percent(5_000_000, None), 0)

    def test_reporter_at_least_once_per_second_monotone_with_step(self):
        sent = []
        now = [0.0]
        reporter = task.ProgressReporter(lambda q, m: sent.append(m),
                                         {'taskId': 't', 'userId': 'u', 'projectId': 'p', 'totalSteps': 4},
                                         lambda: now[0])
        reporter.update(10)
        now[0] = 0.4
        reporter.update(20)            # within 0.5 s: not sent
        now[0] = 1.0
        reporter.update(5)             # lower value: keeps 20
        now[0] = 2.0
        reporter.report()              # no news: repeats the last value
        now[0] = 3.0
        reporter.update(80)
        self.assertEqual([m['progress'] for m in sent], [10, 20, 20, 80])
        self.assertEqual([m['step'] for m in sent], [1, 1, 1, 4])  # D-40
        self.assertTrue(all(m['event'] == 'video-task-update' and m['totalSteps'] == 4 for m in sent))


class CancelledTasksTest(unittest.TestCase):
    def test_ttl_of_four_hours(self):
        now = [0.0]
        cancelled = control.CancelledTasks(clock=lambda: now[0])
        cancelled.add('t1')
        self.assertIn('t1', cancelled)
        now[0] = control.CANCELLED_TTL_S - 1
        self.assertIn('t1', cancelled)
        now[0] = control.CANCELLED_TTL_S + 1
        self.assertNotIn('t1', cancelled)
        self.assertEqual(control.CANCELLED_TTL_S, 4 * 3600)

    def test_ops_registry_gated_by_variable(self):
        self.assertIn('test_reencode', ops.OPERATIONS)
        out = subprocess.run(['python', '-c', 'import ops; print(sorted(ops.OPERATIONS))'],
                             capture_output=True, text=True, env={'PATH': os.environ['PATH'],
                                                                  'PYTHONPATH': os.environ.get('PYTHONPATH', '')})
        # B004 is always active. Retain the original D-37 check for other ops.
        names = ast.literal_eval(out.stdout.strip())
        # B005 is always active as well: present, then set aside like B004.
        self.assertTrue({'watermark', 'adjust', 'filter', 'resize', 'orient'}.issubset(names))
        names = [name for name in names if name not in {'watermark', 'adjust', 'filter', 'resize', 'orient'}]
        self.assertIn('convert', names)
        names = [name for name in names if name != 'convert']
        self.assertIn('concat', names)  # B008: always active, set aside like convert
        names = [name for name in names if name != 'concat']
        self.assertEqual(set(names), {'trim', 'remove_audio', 'speed'})
        out.stdout = str([name for name in names if name not in {'trim', 'remove_audio', 'speed'}])
        self.assertEqual(out.stdout.strip(), '[]')


@unittest.skipUnless(HAS_FFMPEG, 'needs ffmpeg')
class ExecutorRunTest(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()

    def tearDown(self):
        shutil.rmtree(self.dir, ignore_errors=True)

    def run_plan(self, source, plan, **kwargs):
        out = os.path.join(self.dir, 'out.mp4')
        progress = []
        executor.run(executor.build_command(plan, [source], out), self.dir, plan['expectedDurationMs'],
                     wait=lambda s: time.sleep(min(s, 0.05)), on_progress=progress.append,
                     is_cancelled=kwargs.get('is_cancelled', lambda: False))
        return out, progress

    def test_reencode_to_working_format_with_progress(self):
        source = os.path.join(self.dir, 'in.mov')
        make_video(source, '-f', 'lavfi', '-i', 'testsrc2=size=320x240:rate=25', '-f', 'lavfi',
                   '-i', 'sine=frequency=440:sample_rate=48000', '-t', '6', '-c:v', 'libx264',
                   '-pix_fmt', 'yuv444p', '-c:a', 'aac')
        out, progress = self.run_plan(source, encode_plan(expected_ms=6000))
        meta = probe(out)
        self.assertEqual(meta['meta']['videoCodec'], 'h264')
        self.assertEqual(meta['meta']['audioCodec'], 'aac')
        self.assertEqual(meta['stream']['pixFmt'], 'yuv420p')
        self.assertEqual(progress, sorted(progress))
        self.assertTrue(0 < max(progress) <= 99)

    def test_odd_dimensions_and_rotation_applied(self):
        # 321x241 (4:4:4 keeps odd sizes) with a 90 degree display matrix. As in
        # test_ingest.py, FFmpeg 5.1 only writes the matrix when stream-copying.
        plain = os.path.join(self.dir, 'plain.mp4')
        make_video(plain, '-f', 'lavfi', '-i', 'testsrc2=size=640x480:rate=25', '-t', '2',
                   '-vf', 'format=yuv444p,crop=321:241', '-c:v', 'libx264', '-pix_fmt', 'yuv444p')
        source = os.path.join(self.dir, 'odd.mp4')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', plain, '-c', 'copy',
                        '-metadata:s:v:0', 'rotate=270', source], check=True)
        self.assertEqual(probe(source)['meta']['rotation'], 90)
        out, _ = self.run_plan(source, encode_plan(audio=False, expected_ms=2000))
        meta = probe(out)['meta']
        # Autorotate applies the tag; the crop makes both sides even (T-02, Q-ADD-25).
        self.assertEqual((meta['width'], meta['height'], meta['rotation']), (240, 320, 0))
        self.assertIsNone(meta['audioCodec'])

    def test_cancel_ends_ffmpeg(self):
        source = os.path.join(self.dir, 'long.mp4')
        make_video(source, '-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=30', '-t', '60',
                   '-c:v', 'libx264', '-preset', 'ultrafast')
        calls = [0]

        def cancel_soon():
            calls[0] += 1
            return calls[0] >= 2

        started = time.monotonic()
        with self.assertRaises(executor.Cancelled):
            self.run_plan(source, encode_plan(audio=False, expected_ms=60_000), is_cancelled=cancel_soon)
        self.assertLess(time.monotonic() - started, 10)
        self.assertFalse(ffmpeg_running('long.mp4'), 'no FFmpeg left running')

    def test_failure_raises_process_failed_with_stderr_tail(self):
        source = os.path.join(self.dir, 'bad.mp4')
        with open(source, 'wb') as f:
            f.write(b'not a video')
        with self.assertRaises(ingest.ProcessFailed) as ctx:
            self.run_plan(source, encode_plan())
        self.assertIn('bad.mp4', str(ctx.exception))


# ---- TaskRunner with fake AMQP and storage --------------------------------------

class FakeChannel:
    def __init__(self):
        self.published = []
        self.acked = []

    def basic_publish(self, exchange, routing_key, body, properties=None):
        self.published.append((routing_key, json.loads(body)))

    def basic_ack(self, delivery_tag):
        self.acked.append(delivery_tag)

    # control channel
    def basic_get(self, **kw):
        return None, None, None

    def exchange_declare(self, **kw):
        pass

    def queue_declare(self, **kw):
        return type('R', (), {'method': type('M', (), {'queue': 'amq.gen-x'})()})()

    def queue_bind(self, **kw):
        pass

    def basic_consume(self, **kw):
        self.control_callback = kw['on_message_callback']


class FakeConnection:
    def __init__(self, channel):
        self._channel = channel
        self.on_wait = None

    def channel(self):
        return self._channel

    def process_data_events(self, time_limit=0):
        if self.on_wait:
            self.on_wait()
        time.sleep(min(time_limit, 0.05))


class FakeRabbit:
    def __init__(self):
        self._channel = FakeChannel()
        self._connection = FakeConnection(self._channel)


class FakeStorage:
    def __init__(self, sources, missing=False):
        self.sources = sources
        self.uploaded = {}
        self.missing = missing

    def download(self, source, path):
        if self.missing:
            import requests
            resp = requests.Response()
            resp.status_code = 404
            raise requests.HTTPError('404 for url http://seaweedfs:9000/x?X-Amz-Signature=secret', response=resp)
        shutil.copy(self.sources[source['name']], path)

    def upload(self, target, path, content_type):
        self.uploaded[target['name']] = (os.path.getsize(path), content_type)
        return f"{target['projectId']}/{target['stage']}/{target['name']}"


class Method:
    delivery_tag = 7
    redelivered = False


@unittest.skipUnless(HAS_FFMPEG, 'needs ffmpeg')
class TaskRunnerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dir = tempfile.mkdtemp()
        cls.source = os.path.join(cls.dir, 'src.mp4')
        make_video(cls.source, '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=25', '-f', 'lavfi',
                   '-i', 'sine=frequency=440:sample_rate=48000', '-t', '20', '-c:v', 'libx264',
                   '-preset', 'ultrafast', '-c:a', 'aac')

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.dir, ignore_errors=True)

    def runner(self, missing=False):
        logs = []
        rabbit = FakeRabbit()
        runner = task.TaskRunner(rabbit, lambda *a, **k: logs.append((a, k)), lambda t: str(t).split('?')[0])
        runner._storage = FakeStorage({'src.mp4': self.source}, missing=missing)
        return runner, rabbit, logs

    def request(self, task_id='64b0000000000000000000t1'):
        plan = encode_plan(expected_ms=20_000)
        plan['inputs'][0]['source'] = {'userId': 'u', 'projectId': 'p', 'stage': 'video_src', 'name': 'src.mp4'}
        return {'operation': 'task.run', 'taskId': task_id, 'correlationId': 'corr', 'userId': 'u',
                'projectId': 'p', 'totalSteps': 1, 'plan': plan}

    def replies(self, rabbit):
        return [m for q, m in rabbit._channel.published if q == 'video_project_queue']

    def test_completed_flow(self):
        runner, rabbit, logs = self.runner()
        runner.run(rabbit._channel, Method, self.request())

        statuses = [r['status'] for r in self.replies(rabbit)]
        self.assertEqual(statuses, ['started', 'completed'])
        done = self.replies(rabbit)[-1]
        self.assertEqual(done['taskId'], '64b0000000000000000000t1')
        self.assertEqual(done['correlationId'], 'corr')
        self.assertEqual(done['output']['keys'], {
            'original': 'p/video_out/t1.mp4', 'thumb': 'p/video_thumb/t1.thumb.jpg',
            'firstFrame': 'p/video_thumb/t1.frame0.jpg'})
        self.assertFalse(done['output']['previewMade'])
        self.assertEqual(done['output']['meta']['videoCodec'], 'h264')
        self.assertEqual(rabbit._channel.acked, [7])

        progress = [m for q, m in rabbit._channel.published if q == 'video_ws_queue']
        self.assertTrue(progress)
        values = [m['progress'] for m in progress]
        self.assertEqual(values, sorted(values))
        # Exactly one FFmpeg encoding invocation logged (NFR-013).
        commands = [k for a, k in logs if a[1] == 'video.task.ffmpeg']
        self.assertEqual(len(commands), 1)
        self.assertEqual(commands[0]['command'].count('-filter_complex'), 1)
        self.assertFalse(os.path.exists('/tmp/video/64b0000000000000000000t1'))

    def test_cancel_while_running(self):
        runner, rabbit, _ = self.runner()
        waits = [0]

        def cancel_after_some_waits():
            waits[0] += 1
            if waits[0] == 3:
                rabbit._channel.control_callback(None, None, None,
                                                 json.dumps({'taskId': '64b0000000000000000000t2'}).encode())

        rabbit._connection.on_wait = cancel_after_some_waits
        runner.run(rabbit._channel, Method, self.request('64b0000000000000000000t2'))
        self.assertEqual([r['status'] for r in self.replies(rabbit)], ['started', 'cancelled'])
        self.assertEqual(runner._storage.uploaded, {}, 'no result published (TASK-004)')
        self.assertFalse(os.path.exists('/tmp/video/64b0000000000000000000t2'), 'temporaries removed (TASK-005)')
        self.assertEqual(rabbit._channel.acked, [7])

    def test_cancelled_in_queue_is_discarded(self):
        runner, rabbit, _ = self.runner()
        runner._control.cancelled.add('64b0000000000000000000t3')
        runner.run(rabbit._channel, Method, self.request('64b0000000000000000000t3'))
        self.assertEqual([r['status'] for r in self.replies(rabbit)], ['cancelled'])

    def test_missing_original_is_resource_unavailable_without_signature(self):
        runner, rabbit, _ = self.runner(missing=True)
        runner.run(rabbit._channel, Method, self.request('64b0000000000000000000t4'))
        failed = self.replies(rabbit)[-1]
        self.assertEqual(failed['status'], 'failed')
        self.assertEqual(failed['error']['code'], 'RESOURCE_UNAVAILABLE')
        self.assertNotIn('Signature', json.dumps(failed))

    def test_cancel_of_a_task_not_running_removes_its_leftovers(self):
        # Dead-letter after a killed delivery: the projects service publishes the
        # cancellation and the leftover directory goes (NFR-007, ERROR-003).
        runner, rabbit, _ = self.runner()
        leftover = '/tmp/video/64b0000000000000000000t5'
        os.makedirs(leftover, exist_ok=True)
        with open(os.path.join(leftover, task.LOCK_NAME), 'wb') as f:
            f.write(b'')
        rabbit._channel.control_callback(None, None, None,
                                         json.dumps({'taskId': '64b0000000000000000000t5'}).encode())
        self.assertFalse(os.path.exists(leftover))
        self.assertIn('64b0000000000000000000t5', runner._control.cancelled)

    def test_startup_sweep_removes_only_unowned_task_directories(self):
        root = tempfile.mkdtemp()
        dead = os.path.join(root, 'dead')
        alive = os.path.join(root, 'alive')
        ingest_dir = os.path.join(root, 'ingest')
        for d in (dead, alive, ingest_dir):
            os.makedirs(d)
        open(os.path.join(dead, task.LOCK_NAME), 'wb').close()
        # Another process holds the lock of a running task.
        holder = subprocess.Popen(['python', '-c', f"""
import fcntl, os, time
fd = os.open({os.path.join(alive, task.LOCK_NAME)!r}, os.O_CREAT | os.O_RDWR)
fcntl.flock(fd, fcntl.LOCK_EX)
print('locked', flush=True)
time.sleep(30)
"""], stdout=subprocess.PIPE)
        self.assertEqual(holder.stdout.readline().strip(), b'locked')
        try:
            self.assertEqual(task.sweep_leftovers(root), ['dead'])
            self.assertTrue(os.path.isdir(alive), 'running task kept')
            self.assertTrue(os.path.isdir(ingest_dir), 'B001 ingestion directories are not touched')
        finally:
            holder.kill()
            holder.wait()
        self.assertEqual(task.sweep_leftovers(root), ['alive'], 'free once the owner died')
        shutil.rmtree(root)

    def test_preview_plan_choice(self):
        preview = {'browserProfile': {'videoCodec': 'h264', 'pixFmt': 'yuv420p'},
                   'whenCompatible': None, 'whenIncompatible': {'video': 'libx264', 'audio': 'copy'}}
        ok = {'meta': {'videoCodec': 'h264'}, 'stream': {'pixFmt': 'yuv420p'}}
        high10 = {'meta': {'videoCodec': 'h264'}, 'stream': {'pixFmt': 'yuv420p10le'}}
        self.assertIsNone(task.TaskRunner._preview_plan(preview, ok))
        self.assertEqual(task.TaskRunner._preview_plan(preview, high10)['video'], 'libx264')
        self.assertIsNone(task.TaskRunner._preview_plan(None, high10))


if __name__ == '__main__':
    unittest.main()
