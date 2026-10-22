"""B007 format matrix with real FFmpeg/FFprobe 5.1 and full-stream decoding."""

import json
import os
import subprocess
import tempfile
import unittest

import convert_task
import ingest
import task


def probe(path):
    return json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_error', '-show_streams',
        '-show_format', '-of', 'json', path]))


def stream(info, kind):
    return next((item for item in info['streams'] if item['codec_type'] == kind), None)


def packet_hashes(path, kind):
    info = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-select_streams', f'{kind}:0',
        '-show_packets', '-show_data_hash', 'sha256', '-of', 'json', path]))
    return [packet['data_hash'] for packet in info['packets']]


def encode(codec):
    if codec == 'mpeg4':
        return {'mode': 'encode', 'codec': 'mpeg4', 'quality': 3, 'pixFmt': 'yuv420p'}
    return {'mode': 'encode', 'codec': 'libx264', 'preset': 'veryfast',
            'crf': 23, 'pixFmt': 'yuv420p'}


def audio(codec):
    return {'mode': 'encode', 'codec': codec, 'bitrate': '192k' if codec == 'libmp3lame' else '128k'}


def plan(source, target, source_video='h264', source_audio='aac', preview=False):
    vcodec = 'mpeg4' if target == 'avi' else 'h264'
    acodec = 'mp3' if target == 'avi' else 'aac'
    v = {'mode': 'copy'} if source_video == vcodec else encode(vcodec)
    a = ({'mode': 'none'} if source_audio is None else
         {'mode': 'copy'} if source_audio == acodec else
         audio('libmp3lame' if acodec == 'mp3' else 'aac'))
    return {
        'steps': [{'operation': 'convert', 'version': 1, 'parameters': {'target': target}}],
        'output': {'container': target, 'video': v, 'audio': a,
                   'genpts': source == 'avi' and v['mode'] == 'copy',
                   'faststart': target in ('mp4', 'mov')},
        'convert': {'previewInSameInvocation': target == 'avi'},
        'preview': {'browserProfile': {'videoCodec': 'h264', 'pixFmt': 'yuv420p'},
                    'whenIncompatible': {'video': 'libx264',
                                         'audio': None if source_audio is None else 'aac'}},
        'targets': {'preview': {'name': 'preview.mp4'}} if target == 'avi' else {},
    }


class ConvertMatrixTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        for executable in ('ffmpeg', 'ffprobe'):
            version = subprocess.check_output([executable, '-version']).decode().splitlines()[0]
            assert 'version 5.1.' in version, version
        cls.temp = tempfile.TemporaryDirectory(prefix='b007-matrix-')
        cls.root = cls.temp.name
        cls.inputs = {}
        for name, container, vcodec, acodec, size, pix_fmt in [
            ('mp4', 'mp4', 'libx264', 'aac', '320x240', 'yuv420p'),
            ('mov', 'mov', 'libx264', 'aac', '320x240', 'yuv420p'),
            ('avi', 'avi', 'libx264', 'libmp3lame', '320x240', 'yuv420p'),
            ('silent', 'mp4', 'libx264', None, '320x240', 'yuv420p'),
            ('odd', 'mp4', 'libx264', 'aac', '321x241', 'yuv444p'),
            ('incompatible', 'avi', 'libx264', 'libmp3lame', '320x240', 'yuv444p'),
        ]:
            path = os.path.join(cls.root, f'{name}.{container}')
            args = ['ffmpeg', '-v', 'error', '-nostdin', '-y', '-f', 'lavfi',
                    '-i', f'testsrc=size={size}:rate=25:duration=2']
            if acodec:
                args += ['-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=2']
            args += ['-c:v', vcodec, '-pix_fmt', pix_fmt]
            if vcodec == 'libx264':
                args += ['-preset', 'veryfast', '-crf', '23']
            if acodec:
                args += ['-c:a', acodec, '-b:a', '128k' if acodec == 'aac' else '192k']
            args += [path]
            subprocess.run(args, check=True, capture_output=True)
            cls.inputs[name] = path

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def run_case(self, name, target, source_video='h264', source_audio='aac',
                 expected_video=None, expected_audio=None, odd=False):
        source = self.inputs[name]
        input_container = os.path.splitext(source)[1][1:]
        p = plan(input_container, target, source_video, source_audio)
        result = os.path.join(self.root, f'{name}-to-{target}.{target}')
        preview = os.path.join(self.root, f'{name}-to-{target}-preview.mp4') if target == 'avi' else None
        command = convert_task.build_command(p, source, result, preview)
        self.assertEqual(command.count('ffmpeg'), 1)
        self.assertEqual(command.count('-progress'), 1)
        if input_container == 'avi' and p['output']['video']['mode'] == 'copy':
            self.assertIn('+genpts', command)
        if target == 'avi':
            self.assertIn('split=2', ' '.join(command))
            self.assertIn('-q:v', command)
            self.assertEqual(command[command.index('-q:v') + 1], '3')
            if source_audio is not None:
                self.assertIn('192k', command)
        subprocess.run(command, check=True, capture_output=True)
        info = probe(result)
        self.assertNotIn('error', info)
        video, sound = stream(info, 'video'), stream(info, 'audio')
        self.assertEqual(video['codec_name'], expected_video or ('mpeg4' if target == 'avi' else 'h264'))
        self.assertEqual(None if sound is None else sound['codec_name'], expected_audio)
        self.assertEqual((video['width'], video['height']), (320, 240) if odd else
                         (321, 241) if name == 'odd' and p['output']['video']['mode'] == 'copy' else (320, 240))
        self.assertEqual(video['r_frame_rate'], stream(probe(source), 'video')['r_frame_rate'])
        self.assertLess(abs(float(info['format']['duration']) - 2), 0.12)
        subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', result, '-map', '0:v:0',
                        '-f', 'null', '-'], check=True, capture_output=True)
        if sound:
            subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', result, '-map', '0:a:0',
                            '-f', 'null', '-'], check=True, capture_output=True)
        if preview:
            pi = probe(preview)
            self.assertEqual(stream(pi, 'video')['codec_name'], 'h264')
            self.assertEqual(stream(pi, 'video')['pix_fmt'], 'yuv420p')
            self.assertEqual(None if stream(pi, 'audio') is None else stream(pi, 'audio')['codec_name'],
                             None if source_audio is None else 'aac')
            subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', preview,
                            '-f', 'null', '-'], check=True, capture_output=True)
        return result, preview, command

    def test_six_container_paths_and_partial_copy(self):
        for name, target, video, sound in [
            ('mp4', 'mov', 'h264', 'aac'), ('mp4', 'avi', 'mpeg4', 'mp3'),
            ('mov', 'mp4', 'h264', 'aac'), ('mov', 'avi', 'mpeg4', 'mp3'),
            ('avi', 'mp4', 'h264', 'aac'), ('avi', 'mov', 'h264', 'aac'),
        ]:
            with self.subTest(source=name, target=target):
                result, _, command = self.run_case(name, target, source_audio='mp3' if name == 'avi' else 'aac',
                                                    expected_video=video, expected_audio=sound)
                if name in ('mp4', 'mov') and target in ('mov', 'mp4'):
                    self.assertIn('-c:v', command)
                    self.assertEqual(command[command.index('-c:v') + 1], 'copy')
                    self.assertEqual(command[command.index('-c:a') + 1], 'copy')
                    self.assertEqual(packet_hashes(self.inputs[name], 'v'), packet_hashes(result, 'v'))
                    self.assertEqual(packet_hashes(self.inputs[name], 'a'), packet_hashes(result, 'a'))

    def test_silent_and_odd_dimensions(self):
        self.run_case('silent', 'avi', source_audio=None, expected_audio=None)
        self.run_case('odd', 'avi', expected_audio='mp3', odd=True)
        self.run_case('odd', 'mov', expected_audio='aac')

    def test_incompatible_h264_profile_to_mp4_preview(self):
        source = self.inputs['incompatible']
        p = plan('avi', 'mp4', 'h264', 'mp3')
        result = os.path.join(self.root, 'incompatible-to-mp4.mp4')
        subprocess.run(convert_task.build_command(p, source, result), check=True, capture_output=True)
        self.assertEqual(stream(probe(result), 'video')['pix_fmt'], 'yuv444p')
        preview_plan = task.TaskRunner._preview_plan(p['preview'], ingest.probe(result, lambda: None))
        self.assertIsNotNone(preview_plan)
        preview = os.path.join(self.root, 'incompatible-to-mp4-preview.mp4')
        ingest.preview(result, preview, preview_plan, lambda: None)
        self.assertEqual(stream(probe(preview), 'video')['pix_fmt'], 'yuv420p')
        subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', preview, '-f', 'null', '-'],
                       check=True, capture_output=True)


if __name__ == '__main__':
    unittest.main()
