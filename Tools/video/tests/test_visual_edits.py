"""B005 persistent worker suite. Run in the worker (FFmpeg/FFprobe 5.1):

    PYTHONPATH=. python -m unittest -v tests.test_visual_edits

Fixtures live in TemporaryDirectory and are removed even on failure. The
source has four known quadrants (red, green, blue, white) so orientation,
filters, adjustments and the watermark position can be checked on frames at
the start, middle and end of each result.
"""
import copy
import json
import os
import shutil
import subprocess
import tempfile
import unittest

import executor
import ops
import visual_input
from ops import watermark as watermark_op

RED, GREEN, BLUE, WHITE = (255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 255)
QUADRANTS = {'tl': RED, 'tr': GREEN, 'bl': BLUE, 'br': WHITE}
# Copy of projects/video/filters.json (D-58) as test data: the worker itself
# has no catalog and receives the entry in the plan (ADD T-07).
with open(os.path.join(os.path.dirname(__file__), 'visual_filters.json')) as catalog_file:
    CATALOG = json.load(catalog_file)


def ffmpeg(*args):
    return subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-y', *args],
                          check=True, capture_output=True).stdout


def probe(path):
    return json.loads(subprocess.check_output(
        ['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path]))


def stream(info, kind):
    return next((s for s in info['streams'] if s['codec_type'] == kind), None)


def frame_rgb(path, at):
    info = stream(probe(path), 'video')
    width, height = info['width'], info['height']
    raw = ffmpeg('-ss', f'{at:.3f}', '-i', path, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-')
    return raw, width, height


def pixel(frame, x, y):
    raw, width, _ = frame
    index = (y * width + x) * 3
    return tuple(raw[index:index + 3])


def close(actual, expected, tolerance=40):
    return all(abs(a - e) <= tolerance for a, e in zip(actual, expected))


def oriented(rotation, flip_h, flip_v):
    """Reference of ORIENT-004: clockwise rotation first, then the mirrors."""
    grid = [['tl', 'tr'], ['bl', 'br']]
    for _ in range(rotation // 90):
        grid = [[grid[1][0], grid[0][0]], [grid[1][1], grid[0][1]]]
    if flip_h:
        grid = [list(reversed(row)) for row in grid]
    if flip_v:
        grid = list(reversed(grid))
    return {'tl': grid[0][0], 'tr': grid[0][1], 'bl': grid[1][0], 'br': grid[1][1]}


def plan_for(steps, audio='copy'):
    audio_plan = {'mode': audio}
    if audio == 'encode':
        audio_plan.update({'codec': 'aac', 'bitrate': '128k'})
    return {
        'inputs': [{}],
        'steps': [{'operation': op, 'version': 1, 'parameters': parameters, **extra}
                  for op, parameters, extra in steps],
        'output': {'container': 'mp4', 'video': {'mode': 'encode', 'codec': 'libx264',
                   'preset': 'veryfast', 'crf': 23, 'pixFmt': 'yuv420p', 'evenCrop': True},
                   'audio': audio_plan, 'faststart': True, 'genpts': False},
        'preview': None,
    }


class LocalStorage:
    """Download of the plan sources from a local directory (no network)."""

    def __init__(self, root):
        self.root = root
        self.downloads = []

    def download(self, source, path):
        self.downloads.append(source)
        shutil.copyfile(os.path.join(self.root, source['name']), path)


class VisualEditFFmpegTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        version = subprocess.check_output(['ffmpeg', '-version']).decode().splitlines()[0]
        if 'version 5.1.' not in version:
            raise AssertionError(f'D-25 requires FFmpeg 5.1: {version}')
        cls.temp = tempfile.TemporaryDirectory(prefix='b005-unit-')
        cls.root = cls.temp.name
        quad = ("geq=r='if(lt(X,W/2),if(lt(Y,H/2),255,0),if(lt(Y,H/2),0,255))':"
                "g='if(lt(X,W/2),0,255)':"
                "b='if(lt(Y,H/2),0,255)'")
        sine = 'sine=frequency=440:sample_rate=48000:duration=3'
        cls.fixtures = {}
        for name, size, vcodec, acodec in [
            ('quad.mp4', '320x240', 'libx264', 'aac'),
            ('quad.avi', '320x240', 'libx264', 'libmp3lame'),
            ('odd.mp4', '321x241', 'libx264', 'aac'),
        ]:
            path = os.path.join(cls.root, name)
            ffmpeg('-f', 'lavfi', '-i', f'nullsrc=size={size}:rate=25:duration=3,format=rgb24,{quad}',
                   '-f', 'lavfi', '-i', sine, '-c:v', vcodec, '-preset', 'veryfast', '-crf', '12',
                   '-pix_fmt', 'yuv420p' if size != '321x241' else 'yuv444p', '-c:a', acodec, '-shortest', path)
            cls.fixtures[name] = path
        # FFmpeg 5.1 writes the 'rotate' tag as a counter-clockwise display
        # matrix: rotate=90 gives side data +90 (B001 rotation 270, clockwise)
        # and rotate=270 gives -90 (B001 rotation 90, a portrait phone video).
        for name, tag in [('rot.mp4', '90'), ('portrait.mp4', '270')]:
            cls.fixtures[name] = os.path.join(cls.root, name)
            ffmpeg('-i', cls.fixtures['quad.mp4'], '-c', 'copy', '-metadata:s:v:0', f'rotate={tag}',
                   cls.fixtures[name])
        # Opaque magenta mark of 40x20 for the watermark position and opacity.
        ffmpeg('-f', 'lavfi', '-i', 'color=c=magenta:size=40x20', '-frames:v', '1',
               '-pix_fmt', 'rgba', os.path.join(cls.root, 'wm-mark.png'))

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def run_plan(self, source, plan):
        original = copy.deepcopy(plan)
        work = tempfile.mkdtemp(dir=self.root)
        storage = LocalStorage(self.root)
        resolved = visual_input.resolve(plan, work, storage) if visual_input.needed(plan) else plan
        out = os.path.join(work, 'result.mp4')
        cmd = executor.build_command(resolved, [source], out)
        subprocess.run(cmd, check=True, capture_output=True)
        self.assertEqual(plan, original, 'the received plan and recipe stay intact')
        self.assertEqual(cmd.count('-filter_complex'), 1, 'one encoding invocation (NFR-013)')
        return out, probe(out), cmd, storage

    def assert_preserved(self, source, info, width, height, audio_codec='aac'):
        src = probe(source)
        video = stream(info, 'video')
        self.assertEqual((video['width'], video['height']), (width, height))
        self.assertEqual(video['codec_name'], 'h264')
        self.assertEqual(video['pix_fmt'], 'yuv420p')
        self.assertEqual(video['r_frame_rate'], stream(src, 'video')['r_frame_rate'])
        self.assertLessEqual(abs(float(info['format']['duration']) - float(src['format']['duration'])), 0.05)
        self.assertEqual(stream(info, 'audio')['codec_name'], audio_codec)
        self.assertNotIn('rotate', video.get('tags', {}))
        self.assertFalse(any(d.get('rotation') for d in video.get('side_data_list', [])))

    def quadrant_points(self, width, height):
        return {'tl': (width // 4, height // 4), 'tr': (3 * width // 4, height // 4),
                'bl': (width // 4, 3 * height // 4), 'br': (3 * width // 4, 3 * height // 4)}

    # ---- adjust (ADJUST-008/009) ----------------------------------------------

    def test_adjust_uniform_and_properties(self):
        source = self.fixtures['quad.mp4']
        out, info, cmd, _ = self.run_plan(source, plan_for([
            ('adjust', {'brightness': 1, 'contrastFactor': 1, 'saturationFactor': 0}, {})]))
        self.assert_preserved(source, info, 320, 240)
        graph = cmd[cmd.index('-filter_complex') + 1]
        self.assertIn('eq=saturation=0', graph)
        self.assertNotIn('colorchannelmixer', graph, 'neutral brightness adds no filter')
        self.assertEqual(cmd[cmd.index('-c:a') + 1], 'copy', 'AAC audio is copied')
        for at in (0, 1.5, 2.9):
            frame = frame_rgb(out, at)
            for x, y in self.quadrant_points(320, 240).values():
                r, g, b = pixel(frame, x, y)
                self.assertLessEqual(max(r, g, b) - min(r, g, b), 12, ('grey', at, (r, g, b)))

    def test_adjust_brightness_is_multiplicative(self):
        source = self.fixtures['quad.mp4']
        out, _, cmd, _ = self.run_plan(source, plan_for([
            ('adjust', {'brightness': 0.5, 'contrastFactor': 1, 'saturationFactor': 1}, {})]))
        self.assertIn('colorchannelmixer=rr=0.5:gg=0.5:bb=0.5', cmd[cmd.index('-filter_complex') + 1])
        frame = frame_rgb(out, 1)
        points = self.quadrant_points(320, 240)
        self.assertTrue(close(pixel(frame, *points['br']), (128, 128, 128), 20))
        self.assertTrue(close(pixel(frame, *points['tl']), (128, 0, 0), 25))

    def test_adjust_step_values_are_normalized(self):
        filters = ops.get('adjust').video_filters(
            {'brightness': 0.15000000000000002, 'contrastFactor': 1.2, 'saturationFactor': 1})
        self.assertEqual(filters, ['colorchannelmixer=rr=0.15:gg=0.15:bb=0.15', 'eq=contrast=1.2'])

    # ---- filter (FILTER-006/007) ----------------------------------------------

    def test_filters_of_the_catalog(self):
        source = self.fixtures['quad.mp4']
        expected = {
            'bw': {'tl': (76, 76, 76), 'br': (255, 255, 255)},
            'sepia': {'tl': (100, 89, 69), 'tr': (196, 175, 136)},
            'negative': {'tl': (0, 255, 255), 'br': (0, 0, 0)},
        }
        for entry in CATALOG:
            with self.subTest(filter=entry['id']):
                out, info, cmd, _ = self.run_plan(source, plan_for([
                    ('filter', {'filter': entry['id']}, {'filter': entry})]))
                self.assert_preserved(source, info, 320, 240)
                graph = cmd[cmd.index('-filter_complex') + 1]
                if entry['type'] == 'invert':
                    self.assertIn('lutrgb=r=negval:g=negval:b=negval', graph)
                else:
                    self.assertIn('colorchannelmixer=rr=', graph)
                points = self.quadrant_points(320, 240)
                for at in (0, 1.5, 2.9):
                    frame = frame_rgb(out, at)
                    for quadrant, color in expected.get(entry['id'], {}).items():
                        self.assertTrue(close(pixel(frame, *points[quadrant]), color, 30),
                                        (entry['id'], at, quadrant, pixel(frame, *points[quadrant])))
                    if entry['id'] == 'bw':
                        for x, y in points.values():
                            r, g, b = pixel(frame, x, y)
                            self.assertLessEqual(max(r, g, b) - min(r, g, b), 12)

    def test_filter_needs_the_catalog_entry_from_the_plan(self):
        plan = plan_for([('filter', {'filter': 'bw', '_filter': {'type': 'invert'}}, {})])
        with self.assertRaises(ValueError):
            visual_input.resolve(plan, self.root, LocalStorage(self.root))
        plan = plan_for([('filter', {'filter': 'bw', '_filter': {'type': 'invert'}}, {'filter': CATALOG[0]})])
        resolved = visual_input.resolve(plan, self.root, LocalStorage(self.root))
        self.assertEqual(resolved['steps'][0]['parameters']['_filter'], CATALOG[0],
                         'a client value never prevails')
        self.assertEqual(plan['steps'][0]['parameters']['_filter'], {'type': 'invert'}, 'plan not mutated')

    # ---- resize (RESIZE-008/009) ----------------------------------------------

    def test_resize_exact_dimensions_rotation_zero(self):
        for name, width, height in [('quad.mp4', 854, 480), ('rot.mp4', 120, 160), ('quad.mp4', 128, 400)]:
            with self.subTest(name=name, size=(width, height)):
                source = self.fixtures[name]
                out, info, cmd, _ = self.run_plan(source, plan_for([
                    ('resize', {'width': width, 'height': height}, {})]))
                self.assert_preserved(source, info, width, height)
                self.assertIn(f'scale={width}:{height},setsar=1', cmd[cmd.index('-filter_complex') + 1])
                self.assertEqual(stream(info, 'video').get('sample_aspect_ratio', '1:1'), '1:1')
        # The display matrix is applied before the scale, so the top-left of the
        # result is the top-left of the presentation frame: green for rot.mp4
        # (270° clockwise) and blue for portrait.mp4 (90° clockwise).
        for name, color in [('rot.mp4', GREEN), ('portrait.mp4', BLUE)]:
            with self.subTest(presentation=name):
                out, info, _, _ = self.run_plan(self.fixtures[name], plan_for([
                    ('resize', {'width': 120, 'height': 160}, {})]))
                self.assert_preserved(self.fixtures[name], info, 120, 160)
                frame = frame_rgb(out, 1)
                self.assertTrue(close(pixel(frame, 30, 40), color), pixel(frame, 30, 40))

    # ---- orientation (ORIENT-004/008/009) --------------------------------------

    def test_orientation_sixteen_parameter_sets_eight_results(self):
        source = self.fixtures['quad.mp4']
        seen = set()
        for rotation in (0, 90, 180, 270):
            for flip_h in (False, True):
                for flip_v in (False, True):
                    with self.subTest(rotation=rotation, flipH=flip_h, flipV=flip_v):
                        out, info, _, _ = self.run_plan(source, plan_for([
                            ('orient', {'rotation': rotation, 'flipH': flip_h, 'flipV': flip_v}, {})]))
                        swap = rotation in (90, 270)
                        width, height = (240, 320) if swap else (320, 240)
                        self.assert_preserved(source, info, width, height)
                        layout = oriented(rotation, flip_h, flip_v)
                        frame = frame_rgb(out, 1.5)
                        for quadrant, (x, y) in self.quadrant_points(width, height).items():
                            self.assertTrue(close(pixel(frame, x, y), QUADRANTS[layout[quadrant]]),
                                            (quadrant, layout[quadrant], pixel(frame, x, y)))
                        seen.add(tuple(sorted(layout.items())))
        self.assertEqual(len(seen), 8, 'the 16 parameter sets give the 8 orientations')

    def test_orientation_from_presentation_and_odd_crop(self):
        # The operation starts from the presentation orientation (UC-VID-011 Q2):
        # rot.mp4 shows green/white over red/blue (240x320) and 90° more gives
        # red at the top-left; portrait.mp4 plus 90° is the source turned 180°.
        for name, color in [('rot.mp4', RED), ('portrait.mp4', WHITE)]:
            with self.subTest(presentation=name):
                out, info, _, _ = self.run_plan(self.fixtures[name], plan_for([
                    ('orient', {'rotation': 90, 'flipH': False, 'flipV': False}, {})]))
                self.assert_preserved(self.fixtures[name], info, 320, 240)
                frame = frame_rgb(out, 1)
                self.assertTrue(close(pixel(frame, 80, 60), color), pixel(frame, 80, 60))
        _, odd, _, _ = self.run_plan(self.fixtures['odd.mp4'], plan_for([
            ('orient', {'rotation': 90, 'flipH': False, 'flipV': False}, {})]))
        self.assert_preserved(self.fixtures['odd.mp4'], odd, 240, 320)
        _, odd_adjust, _, _ = self.run_plan(self.fixtures['odd.mp4'], plan_for([
            ('adjust', {'brightness': 1.2, 'contrastFactor': 1, 'saturationFactor': 1}, {})]))
        self.assert_preserved(self.fixtures['odd.mp4'], odd_adjust, 320, 240)

    # ---- watermark (WATERMARK-010/011) ------------------------------------------

    def mark_step(self, x, y, width, height, opacity, watermark_id='mark'):
        return ('watermark', {'type': 'image', 'watermarkId': watermark_id, 'scale': 0.2,
                              'opacity': opacity, 'position': {'x': x, 'y': y}},
                {'mark': {'watermarkId': watermark_id,
                          'source': {'userId': 'u', 'projectId': 'p', 'stage': 'video_src',
                                     'name': f'wm-{watermark_id}.png'},
                          'x': x, 'y': y, 'width': width, 'height': height, 'opacity': opacity}})

    def test_watermark_fixed_on_every_frame_with_opacity(self):
        source = self.fixtures['quad.mp4']
        out, info, cmd, storage = self.run_plan(source, plan_for([self.mark_step(200, 150, 80, 40, 1)]))
        self.assert_preserved(source, info, 320, 240)
        self.assertEqual(storage.downloads[0]['name'], 'wm-mark.png')
        self.assertIn('overlay=200:150:eof_action=repeat', cmd[cmd.index('-filter_complex') + 1])
        frames = int(stream(info, 'video')['nb_frames'])
        self.assertEqual(frames, int(stream(probe(source), 'video')['nb_frames']))
        for at in (0, 1.5, 2.9):
            frame = frame_rgb(out, at)
            self.assertTrue(close(pixel(frame, 240, 170), (255, 0, 255)), (at, pixel(frame, 240, 170)))
            self.assertTrue(close(pixel(frame, 190, 140), WHITE), 'outside the mark is unchanged')
        half, _, _, _ = self.run_plan(source, plan_for([self.mark_step(200, 150, 80, 40, 0.5)]))
        for at in (0, 2.9):
            self.assertTrue(close(pixel(frame_rgb(half, at), 240, 170), (255, 128, 255), 30),
                            pixel(frame_rgb(half, at), 240, 170))

    def test_watermark_audio_mp3_becomes_aac_and_aac_is_copied(self):
        source = self.fixtures['quad.avi']
        _, info, cmd, _ = self.run_plan(source, plan_for([self.mark_step(10, 10, 40, 20, 0.8)], audio='encode'))
        self.assert_preserved(source, info, 320, 240, audio_codec='aac')
        self.assertEqual(cmd[cmd.index('-c:a') + 1], 'aac')
        src_audio = float(stream(probe(source), 'audio')['duration'])
        self.assertLessEqual(abs(float(stream(info, 'audio')['duration']) - src_audio), 0.1)

    def test_watermark_chain_labels_and_unsafe_path(self):
        source = self.fixtures['quad.mp4']
        out, _, cmd, _ = self.run_plan(source, plan_for([
            ('orient', {'rotation': 90, 'flipH': False, 'flipV': False}, {}),
            self.mark_step(0, 0, 40, 20, 1)]))
        graph = cmd[cmd.index('-filter_complex') + 1]
        self.assertIn('[wmbase1]', graph)
        self.assertTrue(close(pixel(frame_rgb(out, 1), 10, 5), (255, 0, 255)))
        with self.assertRaises(ValueError):
            watermark_op.video_filters({'_overlay': {'index': 0, 'path': "/tmp/a';b.png", 'x': 0, 'y': 0,
                                                     'width': 1, 'height': 1, 'opacity': 1}})

    def test_watermark_requires_mark_from_plan_and_drops_client_overlay(self):
        step = self.mark_step(0, 0, 40, 20, 1)
        plan = plan_for([(step[0], {**step[1], '_overlay': {'path': '/etc/passwd'}}, {})])
        with self.assertRaises(ValueError):
            visual_input.resolve(plan, self.root, LocalStorage(self.root))
        plan = plan_for([(step[0], {**step[1], '_overlay': {'path': '/etc/passwd'}}, step[2])])
        work = tempfile.mkdtemp(dir=self.root)
        resolved = visual_input.resolve(plan, work, LocalStorage(self.root))
        self.assertEqual(resolved['steps'][0]['parameters']['_overlay']['path'], os.path.join(work, 'mark0.png'))
        self.assertEqual(plan['steps'][0]['parameters']['_overlay'], {'path': '/etc/passwd'}, 'plan not mutated')


if __name__ == '__main__':
    unittest.main()
