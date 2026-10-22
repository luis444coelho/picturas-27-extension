import json
import os
import shutil
import subprocess
import tempfile
import unittest

import ingest
import video_msg

HAS_FFMPEG = shutil.which('ffmpeg') is not None


def noop():
    pass


def make_video(path, *args):
    """Generates a small reference video with FFmpeg (lavfi sources)."""
    cmd = ['ffmpeg', '-v', 'error', '-y'] + list(args) + [path]
    subprocess.run(cmd, check=True)


def probe_json(path):
    out = subprocess.run(
        ['ffprobe', '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', path],
        check=True, capture_output=True,
    ).stdout
    return json.loads(out)


VIDEO_SRC = ['-f', 'lavfi', '-i', 'testsrc2=size=320x240:rate=25']
AUDIO_SRC = ['-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000']


class ParseProbeTest(unittest.TestCase):
    def base(self, **video):
        stream = {'codec_type': 'video', 'codec_name': 'h264', 'width': 1920, 'height': 1080,
                  'pix_fmt': 'yuv420p', 'avg_frame_rate': '30000/1001', 'profile': 'High'}
        stream.update(video)
        return {
            'streams': [stream, {'codec_type': 'audio', 'codec_name': 'aac'}],
            'format': {'format_name': 'mov,mp4,m4a,3gp,3g2,mj2', 'duration': '60.0406',
                       'size': '1000', 'bit_rate': '1400000', 'tags': {'major_brand': 'isom'}},
        }

    def test_metadata_facts(self):
        result = ingest.parse_probe(self.base())
        meta = result['meta']
        self.assertEqual(meta['videoCodec'], 'h264')
        self.assertEqual(meta['audioCodec'], 'aac')
        self.assertEqual((meta['fpsNum'], meta['fpsDen']), (30000, 1001))
        self.assertEqual(meta['durationMs'], 60041)
        self.assertEqual(meta['majorBrand'], 'isom')
        self.assertEqual(result['stream'], {'pixFmt': 'yuv420p', 'bitDepth': 8, 'chroma': '4:2:0', 'profile': 'High'})

    def test_rotation_from_display_matrix_is_clockwise(self):
        data = self.base(side_data_list=[{'side_data_type': 'Display Matrix', 'rotation': -90}])
        self.assertEqual(ingest.parse_probe(data)['meta']['rotation'], 90)
        data = self.base(side_data_list=[{'rotation': 90}])
        self.assertEqual(ingest.parse_probe(data)['meta']['rotation'], 270)

    def test_rotation_from_tag(self):
        self.assertEqual(ingest.parse_probe(self.base(tags={'rotate': '180'}))['meta']['rotation'], 180)
        self.assertEqual(ingest.parse_probe(self.base())['meta']['rotation'], 0)

    def test_high_bit_depth_and_chroma(self):
        stream = ingest.parse_probe(self.base(pix_fmt='yuv422p10le'))['stream']
        self.assertEqual((stream['bitDepth'], stream['chroma']), (10, '4:2:2'))
        stream = ingest.parse_probe(self.base(pix_fmt='yuv444p'))['stream']
        self.assertEqual((stream['bitDepth'], stream['chroma']), (8, '4:4:4'))

    def test_cover_art_is_not_the_video_stream(self):
        data = self.base()
        data['streams'].insert(0, {'codec_type': 'video', 'codec_name': 'mjpeg', 'disposition': {'attached_pic': 1}})
        self.assertEqual(ingest.parse_probe(data)['meta']['videoCodec'], 'h264')

    def test_no_video_stream_is_reported_not_corrupted(self):
        data = self.base()
        data['streams'] = [{'codec_type': 'audio', 'codec_name': 'aac'}]
        meta = ingest.parse_probe(data)['meta']
        self.assertIsNone(meta['videoCodec'])
        self.assertEqual(meta['audioCodec'], 'aac')

    def test_no_audio(self):
        data = self.base()
        data['streams'] = data['streams'][:1]
        self.assertIsNone(ingest.parse_probe(data)['meta']['audioCodec'])

    def test_missing_duration_is_corrupted(self):
        data = self.base()
        del data['format']['duration']
        with self.assertRaises(ingest.CorruptedFile):
            ingest.parse_probe(data)


class PreviewArgsTest(unittest.TestCase):
    def test_remux(self):
        args = ingest.preview_args('in', 'out.mp4', {'video': 'copy', 'audio': 'copy', 'genpts': False})
        self.assertEqual(args, ['-i', 'in', '-map', '0:V:0', '-map', '0:a:0', '-sn', '-dn',
                                '-c:v', 'copy', '-c:a', 'copy', '-movflags', '+faststart', 'out.mp4'])

    def test_avi_copy_uses_genpts_and_aac(self):
        args = ingest.preview_args('in', 'out.mp4', {'video': 'copy', 'audio': 'aac', 'genpts': True})
        self.assertEqual(args[:2], ['-fflags', '+genpts'])
        self.assertIn('aac', args)
        self.assertIn('128k', args)

    def test_reencode_without_audio(self):
        args = ingest.preview_args('in', 'out.mp4', {'video': 'libx264', 'audio': None, 'genpts': False})
        for expected in ['libx264', 'veryfast', '23', 'yuv420p', 'crop=trunc(iw/2)*2:trunc(ih/2)*2', '-an']:
            self.assertIn(expected, args)
        self.assertNotIn('0:a:0', args)


class PumpingFileTest(unittest.TestCase):
    def test_put_body_has_length_and_no_chunked_encoding(self):
        import requests
        from storage import _PumpingFile

        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(b'x' * 3000)
        calls = []
        body = _PumpingFile(tmp.name, lambda: calls.append(1))
        prepared = requests.Request('PUT', 'http://storage/x', data=body,
                                    headers={'Content-Type': 'image/jpeg'}).prepare()
        self.assertEqual(prepared.headers['Content-Length'], '3000')
        self.assertNotIn('Transfer-Encoding', prepared.headers)
        self.assertEqual(b''.join(body), b'x' * 3000)
        self.assertTrue(calls)
        os.unlink(tmp.name)


class RedactTest(unittest.TestCase):
    def test_signature_is_removed(self):
        import importlib
        video = importlib.import_module('video')
        msg = ('500 Server Error: Internal Server Error for url: http://seaweedfs:9000/user-1/p/video_thumb/'
               'x.jpg?AWSAccessKeyId=admin&Content-Type=image%2Fjpeg&Expires=1&Signature=abc%3D')
        out = video.redact(msg)
        self.assertNotIn('Signature', out)
        self.assertNotIn('AWSAccessKeyId', out)
        self.assertIn('http://seaweedfs:9000/user-1/p/video_thumb/x.jpg?<redacted>', out)


class VideoMsgTest(unittest.TestCase):
    def test_reply_fields(self):
        request = {'correlationId': 'c', 'operation': 'ingest.probe', 'videoId': 'v'}
        reply = video_msg.success(request, video_msg.now(), {'meta': {}})
        for field in ['messageId', 'correlationId', 'timestamp', 'status', 'output', 'error', 'metadata']:
            self.assertIn(field, reply)
        self.assertEqual((reply['status'], reply['videoId'], reply['operation']), ('success', 'v', 'ingest.probe'))
        self.assertNotIn('previewRequested', reply)

        failed = video_msg.failure(request, video_msg.now(), 'CORRUPTED_FILE', 'x')
        self.assertEqual(failed['error'], {'code': 'CORRUPTED_FILE', 'message': 'x'})


@unittest.skipUnless(HAS_FFMPEG, 'needs FFmpeg (run inside the video worker image)')
class FfmpegTest(unittest.TestCase):
    """Real FFmpeg 5.1 runs on generated reference videos."""

    @classmethod
    def setUpClass(cls):
        cls.dir = tempfile.mkdtemp()
        d = cls.dir
        cls.mp4 = os.path.join(d, 'a.mp4')
        make_video(cls.mp4, *VIDEO_SRC, *AUDIO_SRC, '-t', '2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                   '-c:a', 'aac', '-movflags', '+faststart', '-shortest')
        # Portrait phone video: the display matrix asks for a 90 degree clockwise
        # rotation (ffprobe reports -90). FFmpeg 5.1 only writes the matrix when
        # stream-copying, and its muxer reads the 'rotate' tag counter-clockwise,
        # hence rotate=270 (checked with pixels during Stage 5).
        plain = os.path.join(d, 'plain.mp4')
        make_video(plain, *VIDEO_SRC, '-t', '1.5', '-c:v', 'libx264', '-pix_fmt', 'yuv420p')
        cls.rotated = os.path.join(d, 'rot.mp4')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', plain, '-c', 'copy',
                        '-metadata:s:v:0', 'rotate=270', cls.rotated], check=True)
        cls.short = os.path.join(d, 'short.mov')
        make_video(cls.short, *VIDEO_SRC, '-t', '0.5', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-f', 'mov')
        cls.avi = os.path.join(d, 'a.avi')
        make_video(cls.avi, *VIDEO_SRC, *AUDIO_SRC, '-t', '2', '-c:v', 'mpeg4', '-c:a', 'libmp3lame', '-shortest')
        cls.high10 = os.path.join(d, 'h10.mp4')
        make_video(cls.high10, *VIDEO_SRC, '-t', '1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p10le')
        cls.audio_only = os.path.join(d, 'audio.mp4')
        make_video(cls.audio_only, *AUDIO_SRC, '-t', '1', '-c:a', 'aac')
        cls.truncated = os.path.join(d, 'trunc.mp4')
        with open(cls.mp4, 'rb') as src:
            data = src.read()
        with open(cls.truncated, 'wb') as dst:
            dst.write(data[: len(data) // 2])
        cls.garbage = os.path.join(d, 'garbage.mp4')
        with open(cls.garbage, 'wb') as dst:
            dst.write(b'\x00\x00\x00\x18ftypisom' + os.urandom(4096))

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.dir, ignore_errors=True)

    def test_probe_mp4(self):
        meta = ingest.probe(self.mp4, noop)['meta']
        self.assertEqual((meta['videoCodec'], meta['audioCodec'], meta['width'], meta['height']), ('h264', 'aac', 320, 240))
        self.assertEqual((meta['fpsNum'], meta['fpsDen']), (25, 1))
        self.assertAlmostEqual(meta['durationMs'], 2000, delta=100)
        self.assertEqual(meta['sizeBytes'], os.path.getsize(self.mp4))

    def test_probe_rotation_tag(self):
        meta = ingest.probe(self.rotated, noop)['meta']
        self.assertEqual(meta['rotation'], 90)
        self.assertEqual((meta['width'], meta['height']), (320, 240))

    def test_probe_mov_brand_and_avi(self):
        self.assertEqual(ingest.probe(self.short, noop)['meta']['majorBrand'].strip(), 'qt')
        meta = ingest.probe(self.avi, noop)['meta']
        self.assertEqual((meta['formatName'], meta['videoCodec'], meta['audioCodec']), ('avi', 'mpeg4', 'mp3'))

    def test_probe_high10(self):
        stream = ingest.probe(self.high10, noop)['stream']
        self.assertEqual((stream['pixFmt'], stream['bitDepth']), ('yuv420p10le', 10))

    def test_probe_audio_only(self):
        self.assertIsNone(ingest.probe(self.audio_only, noop)['meta']['videoCodec'])

    def test_probe_truncated_and_garbage_are_corrupted(self):
        for path in (self.truncated, self.garbage):
            with self.assertRaises(ingest.CorruptedFile, msg=path):
                ingest.probe(path, noop)

    def test_thumbnail_and_first_frame_apply_rotation_and_width(self):
        thumb = os.path.join(self.dir, 'thumb.jpg')
        frame = os.path.join(self.dir, 'frame0.jpg')
        ingest.thumbnail(self.rotated, thumb, 1000, 320, noop)
        ingest.first_frame(self.rotated, frame, 1280, noop)
        for path in (thumb, frame):
            stream = probe_json(path)['streams'][0]
            # 320x240 rotated 90 degrees is shown as 240x320.
            self.assertEqual((stream['width'], stream['height']), (240, 320), path)

    def test_thumbnail_limit_width(self):
        big = os.path.join(self.dir, 'big.mp4')
        make_video(big, '-f', 'lavfi', '-i', 'testsrc2=size=1920x1080:rate=25', '-t', '0.4',
                   '-c:v', 'libx264', '-pix_fmt', 'yuv420p')
        thumb = os.path.join(self.dir, 'big-thumb.jpg')
        frame = os.path.join(self.dir, 'big-frame.jpg')
        ingest.thumbnail(big, thumb, 0, 320, noop)
        ingest.first_frame(big, frame, 1280, noop)
        self.assertEqual(probe_json(thumb)['streams'][0]['width'], 320)
        self.assertEqual(probe_json(frame)['streams'][0]['width'], 1280)

    def test_thumbnail_of_one_second_video_falls_back_to_frame_zero(self):
        one = os.path.join(self.dir, 'one.mp4')
        make_video(one, *VIDEO_SRC, '-t', '1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p')
        thumb = os.path.join(self.dir, 'one-thumb.jpg')
        ingest.thumbnail(one, thumb, 1000, 320, noop)
        self.assertTrue(os.path.getsize(thumb) > 0)

    def test_thumbnail_of_short_video_at_frame_zero(self):
        thumb = os.path.join(self.dir, 'short-thumb.jpg')
        ingest.thumbnail(self.short, thumb, 0, 320, noop)
        self.assertTrue(os.path.getsize(thumb) > 0)

    def test_preview_remux_and_reencode(self):
        cases = [
            (self.short, {'video': 'copy', 'audio': None, 'genpts': False}),
            (self.avi, {'video': 'libx264', 'audio': 'aac', 'genpts': False}),
            (self.high10, {'video': 'libx264', 'audio': None, 'genpts': False}),
        ]
        for source, plan in cases:
            out = os.path.join(self.dir, os.path.basename(source) + '.preview.mp4')
            ingest.preview(source, out, plan, noop)
            data = probe_json(out)
            video = next(s for s in data['streams'] if s['codec_type'] == 'video')
            self.assertEqual((video['codec_name'], video['pix_fmt']), ('h264', 'yuv420p'), source)
            audio = [s['codec_name'] for s in data['streams'] if s['codec_type'] == 'audio']
            self.assertEqual(audio, ['aac'] if plan['audio'] else [], source)


if __name__ == '__main__':
    unittest.main()
