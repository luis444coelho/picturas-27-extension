"""Select server-computed alternatives (ADR-007); never compute business rules."""
import copy
import json
import subprocess
from decimal import Decimal, InvalidOperation


def _probe(args, pump):
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
    return json.loads(out)


def _frames(path, interval, pump, keyframes=False, include_origin=False):
    args = ['ffprobe', '-v', 'error', '-select_streams', 'V:0']
    if keyframes:
        args += ['-skip_frame', 'nokey']
    args += ['-read_intervals', interval, '-show_frames',
             '-show_entries', 'frame=pts_time:format=start_time', '-of', 'json', path]
    payload = _probe(args, pump)
    frames = payload['frames']
    times = [Decimal(frame['pts_time']) for frame in frames if 'pts_time' in frame]
    if not times or any(not value.is_finite() for value in times):
        raise ValueError('keyframe probe returned no timestamps')
    if include_origin:
        return times, Decimal(payload['format']['start_time'])
    return times


def has_keyframe(path, at_ms, pump):
    # Read enough initial packets to flush reordered frames, rather than assume
    # that the first frame has PTS zero or that one packet yields a frame.
    first_pts = _frames(path, '%+#64', pump)[0]
    target = first_pts + Decimal(at_ms) / 1000
    start = max(first_pts, target - 1)
    frames = _frames(path, f'{start}%{target + 1}', pump, keyframes=True)
    return any(round((pts - first_pts) * 1000) == at_ms for pts in frames)


def copy_frame_count(path, alternative, pump):
    """Bound copied packets by the real frame timeline, including reordered B frames.

    Input -to alone stops on decode timestamps and can expose reference frames
    after the selected end. Count presented frames without trusting client fps.
    """
    first_pts = _frames(path, '%+#64', pump)[0]
    start = first_pts + Decimal(alternative['atMs']) / 1000
    end = first_pts + Decimal(alternative['endMs']) / 1000
    times = _frames(path, f'{start}%{end + 1}', pump)
    selected = [pts for pts in times if start - Decimal('0.0005') <= pts < end]
    count = len(selected)
    if count <= 0:
        raise ValueError('keyframe copy contains no presented frames')
    # D-57: packet order is decode order. A reference frame beyond the selected
    # end can precede an in-range B-frame; truncating by count would replace the
    # B-frame with that later reference. Only copy a representable packet prefix.
    payload = _probe(['ffprobe', '-v', 'error', '-select_streams', 'V:0',
                      '-read_intervals', f'{start}%{end + 1}', '-show_packets',
                      '-show_entries', 'packet=pts_time', '-of', 'json', path], pump)
    packets = [Decimal(packet['pts_time']) for packet in payload['packets']]
    if any(not pts.is_finite() for pts in packets):
        raise ValueError('copy packet probe returned invalid timestamps')
    first = next((i for i, pts in enumerate(packets)
                  if round((pts - first_pts) * 1000) == alternative['atMs']), None)
    if first is None or sorted(packets[first:first + count]) != sorted(selected):
        raise ValueError('copy packet prefix cannot preserve the selected end')
    return count


def input_seek_offset(path, pump):
    # -ss is relative to the demuxer's start_time, while D-49 is relative to
    # the first video frame. AAC priming can make those origins differ.
    times, format_start = _frames(path, '%+#64', pump, include_origin=True)
    return times[0] - format_start


def resolve_keyframe_copy(plan, input_path, pump=lambda: None):
    alternative = plan.get('keyframeCopy')
    resolved = copy.deepcopy(plan)
    resolved.pop('keyframeCopy', None)
    if not alternative:
        return resolved, plan['output']['video']['mode']
    try:
        matched = has_keyframe(input_path, alternative['atMs'], pump)
        frame_count = copy_frame_count(input_path, alternative, pump) if matched else None
        seek_offset = input_seek_offset(input_path, pump) if matched else 0
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
    resolved['inputOptions'] = ['-ss', f"{Decimal(alternative['atMs']) / 1000 + seek_offset:.6f}",
                                '-to', f"{Decimal(alternative['endMs']) / 1000 + seek_offset:.6f}"]
    resolved['copyFrameCount'] = frame_count
    return resolved, 'copy'


def insert_input_options(command, plan):
    # Atempo can end before the final frame. Bounded silence in the filter and
    # the server's duration cap align both streams, including fractional fps.
    if any(step['operation'] == 'speed' for step in plan['steps']) and plan['output']['audio']['mode'] == 'encode':
        duration = plan['expectedDurationMs']
        command = command[:-1] + ['-t', f'{duration / 1000:.3f}'] + command[-1:]
    options = plan.get('inputOptions')
    if not options:
        return command
    if len(plan['inputs']) != 1:
        raise ValueError('keyframe input options require exactly one input')
    index = command.index('-i')
    result = command[:index] + list(options) + command[index:]
    if plan.get('copyFrameCount'):
        result = result[:-1] + ['-frames:v', str(plan['copyFrameCount'])] + result[-1:]
    return result
