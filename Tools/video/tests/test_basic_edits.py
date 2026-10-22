"""B004 persistent worker suite. Run in the worker (FFmpeg/FFprobe 5.1):

    PYTHONPATH=. python -m unittest -v tests.test_basic_edits

Fixtures live in TemporaryDirectory and are removed even on failure.
"""
import copy
import json
import math
import os
import subprocess
import tempfile
import unittest
from fractions import Fraction
from types import SimpleNamespace
from unittest.mock import patch

import executor
import ingest
import keyframe
import task
from control import ControlChannel
from control_poll import ControlPoller
from ops import speed
from step_input import with_filter_input


def ffmpeg(*args):
    return subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-y', *args],
                          check=True, capture_output=True).stdout


def probe(path):
    return json.loads(subprocess.check_output(
        ['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path]))


def stream(info, kind):
    return next((s for s in info['streams'] if s['codec_type'] == kind), None)


def plan_for(operation, parameters, fps=(30, 1), audio=True, conditional=False):
    plan = {
        'inputs': [{}],
        'steps': [{'operation': operation, 'version': 1, 'parameters': parameters,
                   'input': {'fpsNum': fps[0], 'fpsDen': fps[1]}}],
        'output': {'container': 'mp4', 'video': {'mode': 'encode', 'codec': 'libx264',
                    'preset': 'veryfast', 'crf': 23, 'pixFmt': 'yuv420p', 'evenCrop': True},
                   'audio': {'mode': 'encode', 'codec': 'aac', 'bitrate': '128k'} if audio else {'mode': 'none'},
                   'faststart': True, 'genpts': False},
        'preview': None,
    }
    if operation == 'remove_audio':
        plan['output']['audio'] = {'mode': 'none'}
    if operation == 'speed':
        plan['expectedDurationMs'] = round(120 * fps[1] / fps[0] * 1000 / parameters['factor'])
    if conditional:
        plan['keyframeCopy'] = {'atMs': parameters['startMs'], 'endMs': parameters['endMs'],
            'video': {'mode': 'copy', 'genpts': False},
            'audio': {'mode': 'copy'} if audio else {'mode': 'none'}, 'dropStep': 0,
            'preview': {'browserProfile': {'videoCodec': 'h264', 'pixFmt': 'yuv420p'},
                        'whenCompatible': None,
                        'whenIncompatible': {'video': 'libx264', 'audio': 'copy' if audio else None, 'genpts': False}}}
    return plan


def hashes(path, start=None, end=None):
    args = ['-i', path, '-map', '0:V:0']
    if start is not None:
        args += ['-vf', f'trim=start={start}:end={end}']
    out = ffmpeg(*args, '-vsync', '0', '-f', 'framemd5', '-')
    return [line.split(b',')[-1].strip() for line in out.splitlines() if not line.startswith(b'#')]


def luma_frames(path, pixels=128 * 96):
    raw = ffmpeg('-i', path, '-map', '0:V:0', '-vsync', '0',
                 '-pix_fmt', 'gray', '-f', 'rawvideo', '-')
    return [raw[index:index + pixels] for index in range(0, len(raw), pixels)]


class BasicEditFFmpegTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        version = subprocess.check_output(['ffmpeg', '-version']).decode().splitlines()[0]
        probe_version = subprocess.check_output(['ffprobe', '-version']).decode().splitlines()[0]
        if 'version 5.1.' not in version or 'version 5.1.' not in probe_version:
            raise AssertionError(f'D-25 requires 5.1: {version}; {probe_version}')
        print(version, flush=True)
        cls.temp = tempfile.TemporaryDirectory(prefix='b004-unit-')
        cls.root = cls.temp.name
        cls.fixtures = {}
        for name, rate, codec, pixel, audio, offset in [
            ('base.mp4', '30', 'libx264', 'yuv420p', 'aac', 0),
            ('fraction.mov', '30000/1001', 'libx264', 'yuv420p', 'aac', 0),
            ('mpeg.avi', '30', 'mpeg4', 'yuv420p', 'libmp3lame', 0),
            ('h264.avi', '30', 'libx264', 'yuv420p', 'libmp3lame', 0),
            ('odd.mp4', '30', 'libx264', 'yuv444p', None, 0),
            ('offset.mp4', '30', 'libx264', 'yuv420p', 'aac', 5),
        ]:
            path = os.path.join(cls.root, name)
            size = '129x97' if pixel == 'yuv444p' else '128x96'
            # A visible frame counter makes adjacent source frames distinguishable
            # even after lossy re-encoding, unlike the small testsrc motion alone.
            video_source = (f'testsrc=size={size}:rate={rate}:duration=4,'
                            'drawtext=text=%{n}:fontsize=24:x=0:y=0:'
                            'fontcolor=white:box=1:boxcolor=black')
            args = ['-f', 'lavfi', '-i', video_source]
            if audio:
                args += ['-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=4']
            args += ['-c:v', codec, '-pix_fmt', pixel, '-g', '30']
            if codec == 'libx264':
                args += ['-preset', 'veryfast', '-crf', '18', '-bf', '2', '-sc_threshold', '0']
            if audio:
                args += ['-c:a', audio]
            if offset:
                args += ['-output_ts_offset', str(offset)]
            ffmpeg(*args, path)
            cls.fixtures[name] = path
        cls.rot = os.path.join(cls.root, 'rot.mp4')
        ffmpeg('-i', cls.fixtures['odd.mp4'], '-c', 'copy', '-metadata:s:v:0', 'rotate=90', cls.rot)

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def execute(self, source, plan):
        original = copy.deepcopy(plan)
        resolved, mode = keyframe.resolve_keyframe_copy(plan, source)
        output = os.path.join(self.root, f'{self.id().split(".")[-1]}-{len(os.listdir(self.root))}.mp4')
        cmd = keyframe.insert_input_options(executor.build_command(resolved, [source], output), resolved)
        subprocess.run(cmd, check=True, capture_output=True)
        self.assertEqual(plan, original, 'recipe and received plan must remain intact')
        return output, probe(output), mode, resolved, cmd

    def assert_duration(self, info, expected, fps):
        video = stream(info, 'video')
        duration = float(info['format']['duration'])
        # MP4 format.duration is serialized in whole milliseconds by FFprobe.
        container_frame = math.ceil(1000 / float(fps)) / 1000
        self.assertLessEqual(abs(duration - expected), container_frame + 1e-6, (duration, expected))
        self.assertLessEqual(abs(float(video['duration']) - expected), 1 / float(fps) + 1e-6)

    def test_trim_keyframe_and_zero_preserve_segment_with_bframes(self):
        source = self.fixtures['base.mp4']
        self.assertGreater(stream(probe(source), 'video')['has_b_frames'], 0)
        for start, end in [(0, 2000), (1000, 3000)]:
            with self.subTest(start=start):
                out, info, mode, _, cmd = self.execute(source, plan_for('trim', {'startMs': start, 'endMs': end}, conditional=True))
                self.assertEqual(mode, 'copy')
                self.assertIn('-ss', cmd)
                self.assert_duration(info, 2, 30)
                expected = hashes(source, start / 1000, end / 1000)
                actual = hashes(out)
                self.assertEqual(actual, expected, 'decoded copied segment must match selected frames')

    def test_fractional_keyframe_copy_and_non_keyframe_end(self):
        source = self.fixtures['fraction.mov']
        copied, copied_info, copied_mode, _, _ = self.execute(source, plan_for(
            'trim', {'startMs': 1001, 'endMs': 2002}, (30000, 1001), conditional=True))
        self.assertEqual(copied_mode, 'copy')
        self.assert_duration(copied_info, 1.001, Fraction(30000, 1001))
        self.assertEqual(hashes(copied), hashes(source, 1.001, 2.002))
        out, info, mode, _, _ = self.execute(source, plan_for('trim', {'startMs': 1001, 'endMs': 2137}, (30000, 1001), conditional=True))
        # D-57: frame 65 is decoded before frame 64. Copying a packet prefix
        # cannot preserve this end, so the persisted encode alternative wins.
        self.assertEqual(mode, 'encode')
        self.assert_duration(info, 1.136, Fraction(30000, 1001))
        self.assertEqual(len(hashes(out)), len(hashes(source, 1.001, 2.137)))
        with self.assertRaisesRegex(ValueError, 'selected end'):
            keyframe.copy_frame_count(source, {'atMs': 1001, 'endMs': 2137}, lambda: None)

    def test_trim_non_keyframe_and_fractional_fps(self):
        for name, fps in [('base.mp4', Fraction(30)), ('fraction.mov', Fraction(30000, 1001))]:
            with self.subTest(name=name):
                out, info, mode, _, cmd = self.execute(self.fixtures[name], plan_for('trim', {'startMs': 137, 'endMs': 2137}, (fps.numerator, fps.denominator), conditional=True))
                self.assertEqual(mode, 'encode')
                self.assertNotIn('-ss', cmd)
                self.assert_duration(info, 2, fps)
                self.assertEqual(Fraction(stream(info, 'video')['r_frame_rate']), fps)
                self.assertEqual(len(hashes(out)), len(hashes(self.fixtures[name], .137, 2.137)))
                # Lossy encoding changes hashes. Match the boundary frames to
                # their source frames, checking against both adjacent frames.
                original_frames = luma_frames(self.fixtures[name])
                actual_frames = luma_frames(out)
                first = math.ceil(.137 * float(fps))
                last = math.ceil(2.137 * float(fps)) - 1
                for actual, index in [(actual_frames[0], first), (actual_frames[-1], last)]:
                    def distance(source):
                        return sum((a - b) ** 2 for a, b in zip(actual, source))
                    correct = distance(original_frames[index])
                    self.assertLess(correct, distance(original_frames[index - 1]))
                    self.assertLess(correct, distance(original_frames[index + 1]))

    def test_nonzero_initial_pts(self):
        source = self.fixtures['offset.mp4']
        self.assertGreater(float(stream(probe(source), 'video')['start_time']), 0)
        self.assertTrue(keyframe.has_keyframe(source, 1000, lambda: None))
        out, info, mode, _, _ = self.execute(source, plan_for('trim', {'startMs': 1000, 'endMs': 3000}, conditional=True))
        self.assertEqual(mode, 'copy')
        self.assert_duration(info, 2, 30)
        self.assertEqual(hashes(out), hashes(self.fixtures['base.mp4'], 1, 3))

    def test_trim_avi_missing_pts_fallback_and_mpeg4(self):
        for name in ['h264.avi', 'mpeg.avi']:
            with self.subTest(name=name):
                source = self.fixtures[name]
                plan = plan_for('trim', {'startMs': 0, 'endMs': 2000},
                                conditional=name == 'h264.avi')
                if name == 'h264.avi':
                    # This AVI has no frame PTS: the approved safe fallback
                    # applies even though its first frame is an I-frame.
                    with self.assertRaisesRegex(ValueError, 'no timestamps'):
                        keyframe.has_keyframe(source, 0, lambda: None)
                out, info, mode, _, _ = self.execute(source, plan)
                self.assertEqual(mode, 'encode')
                self.assert_duration(info, 2, 30)
                self.assertEqual(stream(info, 'audio')['codec_name'], 'aac')
                self.assertEqual(len(hashes(out)), 60)

    def test_remove_audio_formats_and_properties(self):
        for name in ['base.mp4', 'fraction.mov', 'h264.avi', 'mpeg.avi']:
            with self.subTest(name=name):
                source = self.fixtures[name]
                original = probe(source)
                src_video = stream(original, 'video')
                fps = Fraction(src_video['r_frame_rate'])
                plan = plan_for('remove_audio', {}, (fps.numerator, fps.denominator))
                if src_video['codec_name'] == 'h264':
                    plan['output']['video'] = {'mode': 'copy'}
                    plan['output']['genpts'] = name.endswith('.avi')
                out, info, mode, _, _ = self.execute(source, plan)
                self.assertIsNone(stream(info, 'audio'))
                self.assertEqual(stream(info, 'video')['codec_name'], 'h264')
                self.assertEqual(Fraction(stream(info, 'video')['r_frame_rate']), fps)
                self.assertEqual((stream(info, 'video')['width'], stream(info, 'video')['height']), (128, 96))
                # D-55 (a): measure the CFR visual duration from real frames,
                # excluding the removed audio tail and remux start-time padding.
                output_frames, source_frames = hashes(out), hashes(source)
                self.assertLessEqual(abs(len(output_frames) / fps - len(source_frames) / fps), 1 / fps)
                if mode == 'copy':
                    self.assertEqual(output_frames, source_frames)
                else:
                    self.assert_duration(info, float(src_video['duration']), fps)

    def test_speed_range_fps_and_av_sync(self):
        for name, fps in [('base.mp4', Fraction(30)), ('fraction.mov', Fraction(30000, 1001))]:
            for factor in [.25, .5, .75, 1.25, 1.5, 2, 4]:
                with self.subTest(name=name, factor=factor):
                    _, info, mode, _, cmd = self.execute(self.fixtures[name], plan_for('speed', {'factor': factor}, (fps.numerator, fps.denominator)))
                    self.assertEqual(mode, 'encode')
                    video, audio = stream(info, 'video'), stream(info, 'audio')
                    self.assertEqual(Fraction(video['r_frame_rate']), fps)
                    expected = float(stream(probe(self.fixtures[name]), 'video')['duration']) / factor
                    self.assert_duration(info, expected, fps)
                    self.assertLessEqual(abs(float(video['duration']) - float(audio['duration'])), 1 / float(fps) + 1e-6)
                    self.assertIn('atempo=', cmd[cmd.index('-filter_complex') + 1])

    def test_odd_rotation_and_browser_preview(self):
        source = self.fixtures['odd.mp4']
        out, info, mode, resolved, _ = self.execute(source, plan_for('trim', {'startMs': 0, 'endMs': 2000}, audio=False, conditional=True))
        self.assertEqual(mode, 'copy')
        self.assertEqual((stream(info, 'video')['width'], stream(info, 'video')['height']), (129, 97))
        probed = ingest.probe(out, lambda: None)
        preview = task.TaskRunner._preview_plan(resolved['preview'], probed)
        self.assertEqual(preview['video'], 'libx264')
        target = os.path.join(self.root, 'browser-preview.mp4')
        ingest.preview(out, target, preview, lambda: None)
        self.assertEqual(stream(probe(target), 'video')['pix_fmt'], 'yuv420p')
        self.assertEqual((stream(probe(target), 'video')['width'], stream(probe(target), 'video')['height']), (128, 96))
        _, rotated, _, _, _ = self.execute(self.rot, plan_for('speed', {'factor': 2}, audio=False))
        self.assertEqual((stream(rotated, 'video')['width'], stream(rotated, 'video')['height']), (96, 128))


class BasicEditConnectionTest(unittest.TestCase):
    def test_control_poll_receives_cancellation_without_consumer_dispatch(self):
        from tests.test_task import FakeRabbit
        rabbit = FakeRabbit()
        cancelled = []
        control = ControlChannel(rabbit._connection, on_cancel=cancelled.append)
        poller = ControlPoller(control)
        messages = iter([(object(), None, b'{"taskId":"running"}'),
                         (object(), None, b'invalid'), (None, None, None)])
        rabbit._channel.basic_get = lambda **kwargs: next(messages)
        poller.poll()
        self.assertIn('running', control.cancelled)
        self.assertEqual(cancelled, ['running'])
        # No basic_consume callback or process_data_events dispatch occurred.

    def test_fps_server_precedence_no_mutation_and_invalid_input(self):
        step = {'operation': 'speed', 'parameters': {'factor': .25, '_input': {'fpsNum': 999, 'fpsDen': 1}}, 'input': {'fpsNum': 30000, 'fpsDen': 1001}}
        original = copy.deepcopy(step)
        filtered = with_filter_input(step)
        self.assertEqual(step, original)
        self.assertEqual(speed.video_filters(filtered['parameters']), ['setpts=PTS/0.25', 'fps=30000/1001'])
        self.assertEqual(speed.audio_filters(filtered['parameters']), ['atempo=0.5', 'atempo=0.5', 'apad=pad_dur=0.1'])
        for source in [None, {}, {'fpsNum': True, 'fpsDen': 1}, {'fpsNum': '30', 'fpsDen': 1}, {'fpsNum': 30, 'fpsDen': 0}]:
            with self.subTest(source=source), self.assertRaises(ValueError):
                with_filter_input({**step, 'input': source})

    def test_probe_failure_fallback_and_command_arguments(self):
        plan = plan_for('trim', {'startMs': 1000, 'endMs': 3000}, conditional=True)
        with patch.object(keyframe, 'has_keyframe', side_effect=ValueError('probe')):
            fallback, mode = keyframe.resolve_keyframe_copy(plan, 'input')
        self.assertEqual(mode, 'encode')
        command = executor.build_command(fallback, ['input'], 'out.mp4')
        self.assertIs(keyframe.insert_input_options(command, fallback), command)
        with patch.object(keyframe, 'has_keyframe', return_value=True), patch.object(keyframe, 'copy_frame_count', return_value=60), patch.object(keyframe, 'input_seek_offset', return_value=0):
            resolved, mode = keyframe.resolve_keyframe_copy(plan, 'input')
        before = executor.build_command(resolved, ['input'], 'out.mp4')
        after = keyframe.insert_input_options(before, resolved)
        index = before.index('-i')
        self.assertEqual(after[index:index + 6], ['-ss', '1.000000', '-to', '3.000000', '-i', 'input'])
        self.assertEqual(after[:index] + after[index + 4:-3] + after[-1:], before)

    def test_video_mode_isolated_between_real_delivery_lifecycles(self):
        runner = task.TaskRunner.__new__(task.TaskRunner)
        replies = []
        runner._publish = lambda routing, message: replies.append(message)
        runner._log = lambda *args, **kwargs: None
        runner._redact = str
        runner._clock = lambda: 0
        runner._control = SimpleNamespace(cancelled=set())
        runner._reporter = None
        runner._running = None
        runner._video_mode = 'stale'
        def execute(request, work_dir):
            if request.get('b004'):
                runner._video_mode = 'copy'
            if request.get('fail'):
                raise ValueError('intentional test failure')
            return {'keys': {}}
        runner._execute = execute
        channel = SimpleNamespace(basic_ack=lambda **kwargs: None)
        method = SimpleNamespace(delivery_tag=1, redelivered=False)
        with tempfile.TemporaryDirectory(prefix='b004-delivery-') as root, patch.object(task.config, 'TMP_ROOT', root):
            runner.run(channel, method, {'taskId': 'first', 'b004': True})
            runner.run(channel, method, {'taskId': 'second'})
            runner._control.cancelled.add('third')
            runner.run(channel, method, {'taskId': 'third'})
            runner.run(channel, method, {'taskId': 'fourth', 'b004': True, 'fail': True})
            self.assertEqual(os.listdir(root), [])
        self.assertEqual(replies[1]['metadata']['videoMode'], 'copy')
        self.assertTrue(all('videoMode' not in reply['metadata'] for i, reply in enumerate(replies) if i != 1))
        self.assertIsNone(runner._video_mode)
        self.assertEqual(replies[-1]['status'], 'failed')
