"""Select server-computed alternatives (ADR-007); never compute business rules."""
import copy
import json
import subprocess
from decimal import Decimal, InvalidOperation


def _frames(path, interval, pump, keyframes=False):
    args = ['ffprobe', '-v', 'error', '-select_streams', 'V:0']
    if keyframes:
        args += ['-skip_frame', 'nokey']
    args += ['-read_intervals', interval, '-show_frames',
             '-show_entries', 'frame=pts_time', '-of', 'json', path]
    # Keep heartbeats/cancellation alive and reap FFprobe even if pump raises.
    with subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE) as proc:
        try:
            while True:
                try:
                    out, _ = proc.communicate(timeout=0.5)
                    break
                except subprocess.TimeoutExpired:
                    pump()
            if proc.returncode:
                raise ValueError('keyframe probe failed')
        finally:
            if proc.poll() is None:
                proc.kill()
                proc.communicate()
    frames = json.loads(out)['frames']
    times = [Decimal(frame['pts_time']) for frame in frames if 'pts_time' in frame]
    if not times or any(not value.is_finite() for value in times):
        raise ValueError('keyframe probe returned no timestamps')
    return times


def has_keyframe(path, at_ms, pump):
    # Read enough initial packets to flush reordered frames, rather than assume
    # that the first frame has PTS zero or that one packet yields a frame.
    first_pts = _frames(path, '%+#64', pump)[0]
    target = first_pts + Decimal(at_ms) / 1000
    start = max(first_pts, target - 1)
    frames = _frames(path, f'{start}%{target + 1}', pump, keyframes=True)
    return any(round((pts - first_pts) * 1000) == at_ms for pts in frames)


def resolve_keyframe_copy(plan, input_path, pump=lambda: None):
    alternative = plan.get('keyframeCopy')
    resolved = copy.deepcopy(plan)
    resolved.pop('keyframeCopy', None)
    if not alternative:
        return resolved, plan['output']['video']['mode']
    try:
        matched = has_keyframe(input_path, alternative['atMs'], pump)
    except (ValueError, KeyError, TypeError, OSError, InvalidOperation):
        matched = False  # Probe failure falls back to the approved encode plan.
    if not matched:
        return resolved, 'encode'
    resolved['output']['video'] = {'mode': 'copy'}
    resolved['output']['audio'] = copy.deepcopy(alternative['audio'])
    resolved['output']['genpts'] = alternative['video']['genpts']
    resolved['preview'] = copy.deepcopy(alternative['preview'])
    resolved['steps'] = [step for index, step in enumerate(resolved['steps'])
                         if index != alternative['dropStep']]
    resolved['inputOptions'] = ['-ss', f"{alternative['atMs'] / 1000:.3f}",
                                '-to', f"{alternative['endMs'] / 1000:.3f}"]
    return resolved, 'copy'


def insert_input_options(command, plan):
    options = plan.get('inputOptions')
    if not options:
        return command
    if len(plan['inputs']) != 1:
        raise ValueError('keyframe input options require exactly one input')
    index = command.index('-i')
    return command[:index] + list(options) + command[index:]
