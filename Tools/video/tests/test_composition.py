"""B008 worker tests with the real FFmpeg 5.1 of the worker image (ADR-017,
ADR-019): concats of heterogeneous clips, a repeated clip, sub-chains and
final steps, a generic chain with trim + watermark + filter, chains ending in
MOV (generic path) and AVI (composition path, preview in the same invocation),
and the phase of failed replies (D-82).

  docker exec -e PYTHONPATH=/app -e PYTHONDONTWRITEBYTECODE=1 -w /app \\
    picturas-video_worker-1 python -m unittest -v tests.test_composition
"""
import json
import os
import shutil
import subprocess
import tempfile
import unittest

import requests

import task
from tests.test_task import FakeRabbit, Method, make_video

HAS_FFMPEG = shutil.which('ffmpeg') is not None
with open(os.path.join(os.path.dirname(__file__), 'visual_filters.json')) as f:
    CATALOG = {entry['id']: entry for entry in json.load(f)}

H264 = {'mode': 'encode', 'codec': 'libx264', 'preset': 'veryfast', 'crf': 23,
        'pixFmt': 'yuv420p', 'evenCrop': True}
AAC = {'mode': 'encode', 'codec': 'aac', 'bitrate': '128k'}
MPEG4 = {'mode': 'encode', 'codec': 'mpeg4', 'quality': 3, 'pixFmt': 'yuv420p', 'evenCrop': True}
MP3 = {'mode': 'encode', 'codec': 'libmp3lame', 'bitrate': '192k'}
BROWSER = {'videoCodec': 'h264', 'pixFmt': 'yuv420p'}


def ffprobe(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-print_format', 'json', '-show_format',
                          '-show_streams', path], check=True, capture_output=True).stdout
    return json.loads(out)


def stream(info, kind):
    return next((s for s in info['streams'] if s['codec_type'] == kind), None)


def decodes(path):
    """Full decode with -xerror: the file plays from start to end."""
    return subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', path, '-f', 'null', '-'],
                          capture_output=True).returncode == 0


def gray_frame(path, at_s, width, height):
    return subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(at_s), '-i', path, '-frames:v', '1',
                           '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
                          check=True, capture_output=True).stdout[:width * height]


def column_mean(frame, width, height, x):
    return sum(frame[y * width + x] for y in range(height)) / height


def mean_volume(path, start_s, duration_s):
    err = subprocess.run(['ffmpeg', '-v', 'info', '-ss', str(start_s), '-t', str(duration_s), '-i', path,
                          '-af', 'volumedetect', '-vn', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    line = next(l for l in err.splitlines() if 'mean_volume' in l)
    return float(line.split('mean_volume:')[1].split('dB')[0])


class Storage:
    """Sources by name; uploads copied to a directory for FFprobe; failures on demand."""

    def __init__(self, sources, out_dir, fail_download=False, fail_upload=False):
        self.sources = sources
        self.out_dir = out_dir
        self.fail_download = fail_download
        self.fail_upload = fail_upload
        self.downloads = []
        self.uploaded = {}

    def download(self, source, path):
        self.downloads.append(source['name'])
        if self.fail_download or source['name'] not in self.sources:
            resp = requests.Response()
            resp.status_code = 404
            raise requests.HTTPError('404 for url http://seaweedfs:9000/x?X-Amz-Signature=secret',
                                     response=resp)
        shutil.copy(self.sources[source['name']], path)

    def upload(self, target, path, content_type):
        if self.fail_upload:
            raise RuntimeError('storage down')
        kept = os.path.join(self.out_dir, target['name'])
        shutil.copy(path, kept)
        self.uploaded[target['name']] = kept
        return f"{target['projectId']}/{target['stage']}/{target['name']}"


def source(name):
    return {'userId': 'u', 'projectId': 'p', 'stage': 'video_src', 'name': name}


def targets(task_id, container='mp4', preview=False):
    content = {'mp4': 'video/mp4', 'mov': 'video/quicktime', 'avi': 'video/x-msvideo'}[container]
    t = {
        'original': {'userId': 'u', 'projectId': 'p', 'stage': 'video_out',
                     'name': f'{task_id}.{container}', 'contentType': content},
        'thumb': {'userId': 'u', 'projectId': 'p', 'stage': 'video_thumb', 'name': f'{task_id}.thumb.jpg'},
        'firstFrame': {'userId': 'u', 'projectId': 'p', 'stage': 'video_thumb', 'name': f'{task_id}.frame0.jpg'},
    }
    if preview:
        t['preview'] = {'userId': 'u', 'projectId': 'p', 'stage': 'video_preview', 'name': f'{task_id}.mp4'}
    return t


def plan(task_id, inputs, steps, expected_ms, video=H264, audio=AAC, container='mp4', **extra):
    return {
        'inputs': [{'videoId': name, 'container': 'mp4', 'source': source(name)} for name in inputs],
        'steps': steps,
        'output': {'container': container, 'video': video, 'audio': audio,
                   'faststart': container in ('mp4', 'mov'), 'genpts': False},
        'expectedDurationMs': expected_ms,
        'thumbnail': {'atMs': 1000, 'maxWidth': 320},
        'firstFrameMaxWidth': 1280,
        'preview': None,
        'targets': targets(task_id, container),
        **extra,
    }


def step(operation, parameters=None, **extra):
    return {'operation': operation, 'version': 1, 'parameters': parameters or {}, **extra}


def clip(file, steps, duration_ms, has_audio):
    return {'file': file, 'steps': steps, 'output': {'durationMs': duration_ms, 'hasAudio': has_audio}}


def mark_step(x, y, width, height):
    return step('watermark', {'type': 'image', 'watermarkId': 'm', 'scale': 0.2, 'opacity': 1,
                              'position': {'x': x, 'y': y}},
                mark={'watermarkId': 'm', 'source': source('wm-m.png'),
                      'x': x, 'y': y, 'width': width, 'height': height, 'opacity': 1})


@unittest.skipUnless(HAS_FFMPEG, 'needs ffmpeg')
class CompositionTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dir = tempfile.mkdtemp()
        d = lambda name: os.path.join(cls.dir, name)  # noqa: E731
        # First clip with odd dimensions, 25 fps, mono 44.1 kHz audio.
        make_video(d('odd.mp4'), '-f', 'lavfi', '-i', 'testsrc2=size=321x241:rate=25:duration=2',
                   '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100:duration=2',
                   '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ac', '1')
        # 16:9 at 25 fps with stereo audio.
        make_video(d('wide.mp4'), '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=25:duration=3',
                   '-f', 'lavfi', '-i', 'sine=frequency=660:sample_rate=48000:duration=3',
                   '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ac', '2')
        # 9:16 at 30 fps without audio.
        make_video(d('tall.mp4'), '-f', 'lavfi', '-i', 'testsrc2=size=360x640:rate=30:duration=2',
                   '-c:v', 'libx264', '-pix_fmt', 'yuv420p')
        # Phone video: coded 640x360 with a rotation tag; display is portrait.
        make_video(d('landscape.mp4'), '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30:duration=2',
                   '-f', 'lavfi', '-i', 'sine=frequency=880:sample_rate=48000:duration=2',
                   '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac')
        make_video(d('phone.mp4'), '-i', d('landscape.mp4'), '-c', 'copy',
                   '-metadata:s:v:0', 'rotate=270')
        make_video(d('wm-m.png'), '-f', 'lavfi', '-i', 'color=c=red:size=64x32', '-frames:v', '1')
        with open(d('broken.mp4'), 'wb') as f:
            f.write(os.urandom(4096))
        cls.sources = {name: d(name) for name in
                       ('odd.mp4', 'wide.mp4', 'tall.mp4', 'phone.mp4', 'wm-m.png', 'broken.mp4')}

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.dir, ignore_errors=True)

    def setUp(self):
        self.out = tempfile.mkdtemp()

    def tearDown(self):
        shutil.rmtree(self.out, ignore_errors=True)

    def run_task(self, task_id, plan_, total_steps=1, **storage_options):
        logs = []
        rabbit = FakeRabbit()
        runner = task.TaskRunner(rabbit, lambda *a, **k: logs.append((a, k)), lambda t: str(t).split('?')[0])
        runner._storage = Storage(self.sources, self.out, **storage_options)
        request = {'operation': 'task.run', 'taskId': task_id, 'correlationId': 'corr', 'userId': 'u',
                   'projectId': 'p', 'totalSteps': total_steps, 'plan': plan_}
        runner.run(rabbit._channel, Method, request)
        replies = [m for q, m in rabbit._channel.published if q == 'video_project_queue']
        progress = [m for q, m in rabbit._channel.published if q == 'video_ws_queue']
        commands = [k['command'] for a, k in logs if a[1] == 'video.task.ffmpeg']
        return replies, progress, commands, runner._storage

    def completed(self, replies):
        self.assertEqual([r['status'] for r in replies], ['started', 'completed'], replies[-1])
        return replies[-1]

    # ---- concat (UC-VID-013) ------------------------------------------------

    def test_heterogeneous_concat_with_repeated_clip(self):
        """16:9 and 9:16, 25 and 30 fps, with and without audio, a rotated phone
        video, an odd first clip repeated at the end (CONCAT-001/008/009/010)."""
        composition = {
            'clips': [clip(0, [], 2000, True), clip(1, [], 3000, True), clip(2, [], 2000, False),
                      clip(3, [], 2000, True), clip(0, [], 2000, True)],
            'target': {'width': 320, 'height': 240, 'fpsNum': 25, 'fpsDen': 1},
            'audio': 'concat',
        }
        p = plan('64b0000000000000000008a1', ['odd.mp4', 'wide.mp4', 'tall.mp4', 'phone.mp4'],
                 [step('concat')], 11_000, composition=composition)
        replies, progress, commands, storage = self.run_task('64b0000000000000000008a1', p)
        done = self.completed(replies)

        # One download per distinct file, one input per occurrence, one encoding (NFR-013).
        self.assertEqual(storage.downloads, ['odd.mp4', 'wide.mp4', 'tall.mp4', 'phone.mp4'])
        self.assertEqual(len(commands), 1)
        self.assertEqual(commands[0].count(' -i '), 5)
        self.assertEqual(commands[0].count('-filter_complex'), 1)
        self.assertIn('concat=n=5:v=1:a=1', commands[0])
        self.assertTrue(progress and all(m['totalSteps'] == 1 for m in progress))

        out = storage.uploaded['64b0000000000000000008a1.mp4']
        info = ffprobe(out)
        video, audio = stream(info, 'video'), stream(info, 'audio')
        self.assertEqual((video['codec_name'], video['width'], video['height']), ('h264', 320, 240))
        self.assertEqual(video['r_frame_rate'], '25/1')
        self.assertEqual(video['pix_fmt'], 'yuv420p')
        self.assertEqual((audio['codec_name'], audio['channels'], audio['sample_rate']), ('aac', 2, '48000'))
        self.assertAlmostEqual(float(info['format']['duration']), 11.0, delta=0.15)
        self.assertEqual(done['output']['meta']['width'], 320)
        self.assertTrue(decodes(out))

        # 9:16 clip (5–7 s) and the rotated phone clip (7–9 s): black bars at the sides.
        for at in (6.0, 8.0):
            frame = gray_frame(out, at, 320, 240)
            self.assertLess(column_mean(frame, 320, 240, 2), 24, f'pillarbox at {at}s')
            self.assertGreater(column_mean(frame, 320, 240, 160), 24, f'picture at {at}s')
        # The 16:9 clip (2–5 s) fills 320×240 up to 1 px rows (letterbox ≤ 1 row).
        frame = gray_frame(out, 3.5, 320, 240)
        self.assertGreater(column_mean(frame, 320, 240, 2), 24)
        # Silence in the clip without audio, sound elsewhere (CONCAT-009).
        self.assertLess(mean_volume(out, 5.2, 1.5), -80)
        self.assertGreater(mean_volume(out, 2.5, 2), -40)

    def test_concat_without_any_audio(self):
        composition = {'clips': [clip(0, [], 2000, False), clip(0, [], 2000, False)],
                       'target': {'width': 360, 'height': 640, 'fpsNum': 30, 'fpsDen': 1},
                       'audio': 'none'}
        p = plan('64b0000000000000000008a2', ['tall.mp4'], [step('concat')], 4000,
                 audio={'mode': 'none'}, composition=composition)
        replies, _, commands, storage = self.run_task('64b0000000000000000008a2', p)
        self.completed(replies)
        self.assertIn('concat=n=2:v=1:a=0', commands[0])
        self.assertEqual(storage.downloads, ['tall.mp4'])
        info = ffprobe(storage.uploaded['64b0000000000000000008a2.mp4'])
        self.assertIsNone(stream(info, 'audio'))
        self.assertAlmostEqual(float(info['format']['duration']), 4.0, delta=0.1)

    def test_concat_with_sub_chains_and_final_steps(self):
        """(wide + trim + sepia) + (phone + speed 2×) + (odd + watermark) → concat
        → orient 90° + adjust (CHAIN-005, CHAIN-006, FA1)."""
        composition = {
            'clips': [
                clip(0, [step('trim', {'startMs': 500, 'endMs': 2500}),
                         step('filter', {'filter': 'sepia'}, filter=CATALOG['sepia'])], 2000, True),
                clip(1, [step('speed', {'factor': 2}, input={'fpsNum': 30, 'fpsDen': 1})], 1000, True),
                clip(2, [mark_step(10, 10, 64, 32)], 2000, True),
            ],
            'target': {'width': 640, 'height': 360, 'fpsNum': 25, 'fpsDen': 1},
            'audio': 'concat',
        }
        steps = [step('concat'),
                 step('orient', {'rotation': 90, 'flipH': False, 'flipV': False}),
                 step('adjust', {'brightness': 1.2, 'contrastFactor': 1, 'saturationFactor': 1})]
        p = plan('64b0000000000000000008a3', ['wide.mp4', 'phone.mp4', 'odd.mp4'], steps, 5000,
                 composition=composition)
        replies, progress, commands, storage = self.run_task('64b0000000000000000008a3', p, total_steps=6)
        self.completed(replies)
        self.assertEqual(len(commands), 1)
        command = commands[0]
        for expected in ('trim=start=0.500:end=2.500', 'colorchannelmixer', 'setpts=PTS/2',
                         'overlay=10:10', 'concat=n=3:v=1:a=1', 'transpose=1'):
            self.assertIn(expected, command)
        self.assertIn('wm-m.png', storage.downloads)
        info = ffprobe(storage.uploaded['64b0000000000000000008a3.mp4'])
        video = stream(info, 'video')
        self.assertEqual((video['width'], video['height']), (360, 640))
        self.assertAlmostEqual(float(info['format']['duration']), 5.0, delta=0.15)
        self.assertTrue(decodes(storage.uploaded['64b0000000000000000008a3.mp4']))
        # "Passo k de N" approximated from the progress (D-40, CHAIN-012).
        self.assertTrue(all(m['totalSteps'] == 6 and 1 <= m['step'] <= 6 for m in progress))

    # ---- chains without concat (UC-VID-014) ----------------------------------

    def test_generic_chain_trim_watermark_filter(self):
        """Generic B003 path with the keyframe check (B004) and visual_input (B005) in one task."""
        steps = [step('trim', {'startMs': 1000, 'endMs': 2500}, input={'fpsNum': 25, 'fpsDen': 1}),
                 mark_step(20, 20, 64, 32),
                 step('filter', {'filter': 'bw'}, filter=CATALOG['bw'])]
        p = plan('64b0000000000000000008b1', ['wide.mp4'], steps, 1500)
        replies, _, commands, storage = self.run_task('64b0000000000000000008b1', p, total_steps=3)
        done = self.completed(replies)
        self.assertEqual(done['metadata'].get('videoMode'), 'encode')
        self.assertEqual(len(commands), 1)
        self.assertIn('overlay=20:20', commands[0])
        self.assertEqual(storage.downloads, ['wide.mp4', 'wm-m.png'])
        info = ffprobe(storage.uploaded['64b0000000000000000008b1.mp4'])
        self.assertAlmostEqual(float(info['format']['duration']), 1.5, delta=0.1)
        video = stream(info, 'video')
        self.assertEqual((video['width'], video['height']), (640, 360))

    def test_chain_ending_in_mov_uses_the_generic_path(self):
        steps = [step('adjust', {'brightness': 1.2, 'contrastFactor': 1, 'saturationFactor': 1}),
                 step('convert', {'target': 'mov'})]
        p = plan('64b0000000000000000008b2', ['wide.mp4'], steps, 3000, container='mov',
                 preview={'browserProfile': BROWSER,
                          'whenCompatible': {'video': 'copy', 'audio': 'copy', 'genpts': False},
                          'whenIncompatible': {'video': 'libx264', 'audio': 'copy', 'genpts': False}})
        p['targets'] = targets('64b0000000000000000008b2', 'mov', preview=True)
        replies, _, commands, storage = self.run_task('64b0000000000000000008b2', p, total_steps=2)
        done = self.completed(replies)
        self.assertEqual(len(commands), 1)
        self.assertNotIn('split=2', commands[0])
        info = ffprobe(storage.uploaded['64b0000000000000000008b2.mov'])
        self.assertEqual(info['format']['format_name'].split(',')[0], 'mov')
        self.assertEqual((stream(info, 'video')['codec_name'], stream(info, 'audio')['codec_name']), ('h264', 'aac'))
        self.assertTrue(done['output']['previewMade'])
        self.assertTrue(decodes(storage.uploaded['64b0000000000000000008b2.mp4']))

    def test_chain_ending_in_avi_makes_the_preview_in_the_same_invocation(self):
        steps = [step('adjust', {'brightness': 1.2, 'contrastFactor': 1, 'saturationFactor': 1}),
                 step('convert', {'target': 'avi'})]
        p = plan('64b0000000000000000008b3', ['wide.mp4'], steps, 3000, video=MPEG4, audio=MP3,
                 container='avi', convert={'previewInSameInvocation': True},
                 preview={'browserProfile': BROWSER,
                          'whenCompatible': {'video': 'copy', 'audio': 'aac', 'genpts': True},
                          'whenIncompatible': {'video': 'libx264', 'audio': 'aac', 'genpts': False}})
        p['targets'] = targets('64b0000000000000000008b3', 'avi', preview=True)
        replies, _, commands, storage = self.run_task('64b0000000000000000008b3', p, total_steps=2)
        done = self.completed(replies)
        self.assertEqual(len(commands), 1, 'AVI and MP4 preview in one FFmpeg invocation (T-06)')
        self.assertIn('split=2', commands[0])
        self.assertIn('asplit=2', commands[0])
        avi = ffprobe(storage.uploaded['64b0000000000000000008b3.avi'])
        mp4 = ffprobe(storage.uploaded['64b0000000000000000008b3.mp4'])
        self.assertEqual((stream(avi, 'video')['codec_name'], stream(avi, 'audio')['codec_name']), ('mpeg4', 'mp3'))
        self.assertEqual((stream(mp4, 'video')['codec_name'], stream(mp4, 'audio')['codec_name']), ('h264', 'aac'))
        self.assertTrue(done['output']['previewMade'])
        self.assertEqual(done['output']['keys']['preview'], 'p/video_preview/64b0000000000000000008b3.mp4')
        for path in storage.uploaded.values():
            if path.endswith(('.avi', '.mp4')):
                self.assertTrue(decodes(path), path)

    def test_concat_ending_in_avi(self):
        composition = {'clips': [clip(0, [], 3000, True), clip(1, [], 2000, False)],
                       'target': {'width': 640, 'height': 360, 'fpsNum': 25, 'fpsDen': 1},
                       'audio': 'concat'}
        p = plan('64b0000000000000000008b4', ['wide.mp4', 'tall.mp4'],
                 [step('concat'), step('convert', {'target': 'avi'})], 5000, video=MPEG4, audio=MP3,
                 container='avi', composition=composition, convert={'previewInSameInvocation': True},
                 preview={'browserProfile': BROWSER, 'whenCompatible': None,
                          'whenIncompatible': {'video': 'libx264', 'audio': 'aac', 'genpts': False}})
        p['targets'] = targets('64b0000000000000000008b4', 'avi', preview=True)
        replies, _, commands, storage = self.run_task('64b0000000000000000008b4', p, total_steps=2)
        self.completed(replies)
        self.assertEqual(len(commands), 1)
        avi = ffprobe(storage.uploaded['64b0000000000000000008b4.avi'])
        self.assertEqual(stream(avi, 'video')['codec_name'], 'mpeg4')
        self.assertAlmostEqual(float(avi['format']['duration']), 5.0, delta=0.15)
        self.assertTrue(decodes(storage.uploaded['64b0000000000000000008b4.mp4']))

    # ---- phase of a failure (D-82, ADR-019) -----------------------------------

    def failed(self, replies):
        self.assertEqual(replies[-1]['status'], 'failed', replies[-1])
        return replies[-1]['error']

    def test_phase_download_encode_upload_on_every_path(self):
        generic = lambda tid, name='wide.mp4': plan(tid, [name], [step('adjust', {  # noqa: E731
            'brightness': 1.2, 'contrastFactor': 1, 'saturationFactor': 1})], 3000)
        concat = lambda tid: plan(tid, ['wide.mp4', 'tall.mp4'], [step('concat')], 5000, composition={  # noqa: E731
            'clips': [clip(0, [], 3000, True), clip(1, [], 2000, False)],
            'target': {'width': 640, 'height': 360, 'fpsNum': 25, 'fpsDen': 1}, 'audio': 'concat'})

        error = self.failed(self.run_task('64b0000000000000000008c1', generic('64b0000000000000000008c1'),
                                          fail_download=True)[0])
        self.assertEqual((error['code'], error['phase']), ('RESOURCE_UNAVAILABLE', 'download'))
        error = self.failed(self.run_task('64b0000000000000000008c2',
                                          generic('64b0000000000000000008c2', 'broken.mp4'))[0])
        self.assertEqual((error['code'], error['phase']), ('PROCESSING_ERROR', 'encode'))
        error = self.failed(self.run_task('64b0000000000000000008c3', generic('64b0000000000000000008c3'),
                                          fail_upload=True)[0])
        self.assertEqual((error['code'], error['phase']), ('PROCESSING_ERROR', 'upload'))

        error = self.failed(self.run_task('64b0000000000000000008c4', concat('64b0000000000000000008c4'),
                                          fail_upload=True)[0])
        self.assertEqual(error['phase'], 'upload')
        broken = concat('64b0000000000000000008c5')
        broken['inputs'][1]['source'] = source('broken.mp4')
        error = self.failed(self.run_task('64b0000000000000000008c5', broken)[0])
        self.assertEqual(error['phase'], 'encode')
        missing_mark = plan('64b0000000000000000008c6', ['wide.mp4', 'tall.mp4'], [step('concat')], 5000,
                            composition={'clips': [clip(0, [mark_step(0, 0, 64, 32)], 3000, True),
                                                   clip(1, [], 2000, False)],
                                         'target': {'width': 640, 'height': 360, 'fpsNum': 25, 'fpsDen': 1},
                                         'audio': 'concat'})
        missing_mark['composition']['clips'][0]['steps'][0]['mark']['source'] = source('wm-missing.png')
        error = self.failed(self.run_task('64b0000000000000000008c6', missing_mark)[0])
        self.assertEqual((error['code'], error['phase']), ('RESOURCE_UNAVAILABLE', 'download'))

        # The B007 conversion path marks the upload too.
        convert = plan('64b0000000000000000008c7', ['wide.mp4'], [step('convert', {'target': 'mov'})], 3000,
                       container='mov')
        convert['output']['video'] = {'mode': 'copy'}
        convert['output']['audio'] = {'mode': 'copy'}
        error = self.failed(self.run_task('64b0000000000000000008c7', convert, fail_upload=True)[0])
        self.assertEqual(error['phase'], 'upload')

        # A later success has no error and the phase does not leak into it.
        replies, _, _, _ = self.run_task('64b0000000000000000008c8', generic('64b0000000000000000008c8'))
        self.assertNotIn('error', {k: v for k, v in self.completed(replies).items() if v})


if __name__ == '__main__':
    unittest.main()
