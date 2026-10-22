import json
import os
import subprocess

import config


class CorruptedFile(Exception):
    """The file cannot be read as a video (UPLOAD-012)."""


class ProcessFailed(Exception):
    """FFmpeg/FFprobe ended with an error. The message is the end of stderr,
    which only goes to the logs (ERROR-002)."""


def run(cmd, pump):
    """Runs a command while serving RabbitMQ heartbeats (ADD T-03).

    FFmpeg already runs in its own process, so the main thread only waits in
    short steps and calls pump() between them.
    """
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    while True:
        try:
            stdout, stderr = proc.communicate(timeout=0.5)
            break
        except subprocess.TimeoutExpired:
            pump()
    return proc.returncode, stdout.decode(errors='replace'), stderr.decode(errors='replace')


def _tail(text, lines=20):
    return '\n'.join(text.strip().splitlines()[-lines:])


def _fraction(value):
    try:
        num, den = (int(x) for x in str(value).split('/'))
    except ValueError:
        return None
    return (num, den) if num > 0 and den > 0 else None


def _rotation(stream):
    """Rotation tag normalised to 0/90/180/270, clockwise as the 'rotate' tag.

    FFmpeg 5.1 reports the display matrix as counter-clockwise degrees
    (e.g. -90 for a video shot in portrait), so the sign is inverted.
    """
    raw = None
    for side_data in stream.get('side_data_list', []):
        if 'rotation' in side_data:
            raw = -float(side_data['rotation'])
            break
    if raw is None and 'rotate' in stream.get('tags', {}):
        raw = float(stream['tags']['rotate'])
    if raw is None:
        return 0
    return int(round(raw / 90.0)) * 90 % 360


def _bit_depth(pix_fmt):
    for depth in (16, 14, 12, 10, 9):
        if f'p{depth}' in pix_fmt:
            return depth
    return 8


def _chroma(pix_fmt):
    if '444' in pix_fmt:
        return '4:4:4'
    if '422' in pix_fmt:
        return '4:2:2'
    return '4:2:0'


def parse_probe(data):
    """Facts from FFprobe JSON. Business rules stay in the projects service."""
    streams = data.get('streams', [])
    video = next(
        (s for s in streams
         if s.get('codec_type') == 'video' and not s.get('disposition', {}).get('attached_pic')),
        None,
    )
    audio = next((s for s in streams if s.get('codec_type') == 'audio'), None)
    fmt = data.get('format', {})

    if 'duration' not in fmt:
        raise CorruptedFile('no duration')

    # A file without a video stream is not corrupted: it is reported with
    # videoCodec None and the projects service rejects it as INVALID_CODEC (D-24).
    video = video or {}
    fps = _fraction(video.get('avg_frame_rate')) or _fraction(video.get('r_frame_rate')) or (0, 1)
    pix_fmt = video.get('pix_fmt', '')

    return {
        'meta': {
            'formatName': fmt.get('format_name'),
            'majorBrand': fmt.get('tags', {}).get('major_brand'),
            'videoCodec': video.get('codec_name'),
            'audioCodec': audio.get('codec_name') if audio else None,
            'width': int(video.get('width', 0)),
            'height': int(video.get('height', 0)),
            'rotation': _rotation(video),
            'fpsNum': fps[0],
            'fpsDen': fps[1],
            'durationMs': int(round(float(fmt['duration']) * 1000)),
            'sizeBytes': int(fmt.get('size', 0)),
            'bitrate': int(fmt['bit_rate']) if fmt.get('bit_rate') else None,
        },
        'stream': {
            'pixFmt': pix_fmt,
            'bitDepth': _bit_depth(pix_fmt),
            'chroma': _chroma(pix_fmt),
            'profile': video.get('profile'),
        },
    }


def probe(path, pump):
    code, out, err = run(
        ['ffprobe', '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', path],
        pump,
    )
    if code != 0:
        raise CorruptedFile(_tail(err))
    try:
        result = parse_probe(json.loads(out))
    except (ValueError, KeyError) as exc:
        raise CorruptedFile(str(exc))

    if result['meta']['videoCodec'] is None:
        return result

    # Reads every packet of the video stream without decoding: catches bodies
    # truncated after a readable header (UPLOAD-012).
    code, _, err = run(
        ['ffprobe', '-v', 'error', '-select_streams', 'V:0', '-count_packets',
         '-show_entries', 'stream=nb_read_packets', '-of', 'json', path],
        pump,
    )
    if code != 0 or err.strip():
        raise CorruptedFile(_tail(err))

    return result


def _ffmpeg(args, pump):
    code, _, err = run(['ffmpeg', '-v', 'error', '-nostdin', '-y'] + args, pump)
    if code != 0:
        raise ProcessFailed(_tail(err))


def thumbnail(path, out, at_ms, max_width, pump):
    """JPEG at at_ms with the rotation applied (FFmpeg autorotate) (UPLOAD-014, D-20).

    A video of about 1 s has no frame starting at 00:00:01; then frame 0 is
    used, as for videos shorter than 1 s (Q-ADD-22, D-26).
    """
    for seek_ms in ([at_ms, 0] if at_ms > 0 else [0]):
        _ffmpeg(
            ['-ss', f'{seek_ms / 1000:.3f}', '-i', path, '-frames:v', '1',
             '-vf', f"scale='min({max_width},iw)':-2",
             '-q:v', config.THUMBNAIL_JPEG_QUALITY, out],
            pump,
        )
        if os.path.exists(out):
            return
    raise ProcessFailed('thumbnail not produced')


def first_frame(path, out, max_width, pump):
    """Frame 0, rotated and at most max_width px wide (ADD T-07)."""
    _ffmpeg(
        ['-i', path, '-frames:v', '1',
         '-vf', f"scale='min({max_width},iw)':-2",
         '-q:v', config.FIRST_FRAME_JPEG_QUALITY, out],
        pump,
    )
    if not os.path.exists(out):
        raise ProcessFailed('first frame not produced')


def preview_args(path, out, plan):
    """FFmpeg arguments of the MP4 preview copy for the plan computed by the
    projects service (ADD T-05, T-06). The worker does not decide the plan."""
    args = []
    if plan.get('genpts'):
        args += ['-fflags', '+genpts']
    args += ['-i', path, '-map', '0:V:0']
    if plan.get('audio'):
        args += ['-map', '0:a:0']
    args += ['-sn', '-dn']

    if plan['video'] == 'copy':
        args += ['-c:v', 'copy']
    else:
        # libx264 with yuv420p does not encode odd dimensions: crop 1 px (ADD T-02).
        args += ['-c:v', 'libx264', '-preset', config.PREVIEW_X264_PRESET, '-crf', config.PREVIEW_X264_CRF,
                 '-pix_fmt', 'yuv420p', '-vf', 'crop=trunc(iw/2)*2:trunc(ih/2)*2']

    if plan.get('audio') == 'copy':
        args += ['-c:a', 'copy']
    elif plan.get('audio') == 'aac':
        args += ['-c:a', 'aac', '-b:a', config.PREVIEW_AAC_BITRATE]
    else:
        args += ['-an']

    args += ['-movflags', '+faststart', out]
    return args


def preview(path, out, plan, pump):
    _ffmpeg(preview_args(path, out, plan), pump)
