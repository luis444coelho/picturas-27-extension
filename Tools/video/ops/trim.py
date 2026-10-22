"""Temporal crop, used only when the server's keyframe alternative is not chosen."""
NAME = 'trim'


def video_filters(parameters):
    start, end = parameters['startMs'] / 1000, parameters['endMs'] / 1000
    return [f'trim=start={start:.3f}:end={end:.3f}', 'setpts=PTS-STARTPTS']


def audio_filters(parameters):
    start, end = parameters['startMs'] / 1000, parameters['endMs'] / 1000
    return [f'atrim=start={start:.3f}:end={end:.3f}', 'asetpts=PTS-STARTPTS']
