"""Speed filters, using server-owned input fps (D-52) and FFmpeg 5.1 atempo."""
NAME = 'speed'


def video_filters(parameters):
    factor = parameters['factor']
    source = parameters['_input']
    return [f'setpts=PTS/{factor:.12g}', f"fps={source['fpsNum']}/{source['fpsDen']}"]


def audio_filters(parameters):
    factor = parameters['factor']
    if factor < 0.5:
        return ['atempo=0.5', f'atempo={factor * 2:.12g}']
    return [f'atempo={factor:.12g}']
