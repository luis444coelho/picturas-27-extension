"""Concat (ADD 4.8, T-02, ADR-017): the branch of each clip and the concat
filter. The clips and their sub-chains are built by composition_task; this
module only turns the normalization of the plan into FFmpeg filters."""
NAME = 'concat'

AUDIO_FORMAT = 'aresample=48000,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo'


def normalize_video(target):
    """Display W×H and fps of the first clip, black bars, no distortion
    (CONCAT-008, UC-VID-013 RN5)."""
    width, height = int(target['width']), int(target['height'])
    fps = f"{int(target['fpsNum'])}/{int(target['fpsDen'])}"
    return [
        f'scale={width}:{height}:force_original_aspect_ratio=decrease:force_divisible_by=2',
        f'pad={width}:{height}:(ow-iw)/2:(oh-ih)/2',
        f'fps={fps}',
        'setsar=1',
        'format=yuv420p',
    ]


def silence(duration_ms):
    """Silence with the duration of a clip without audio (CONCAT-009)."""
    return f'anullsrc=r=48000:cl=stereo,atrim=duration={int(duration_ms) / 1000:.3f},{AUDIO_FORMAT}'


def concat_filter(count, audio):
    return f"concat=n={int(count)}:v=1:a={1 if audio else 0}"


# The concat step itself has no linear filters (the executor never sees it).
def video_filters(parameters):
    return []


def audio_filters(parameters):
    return []
