"""Filter (ADD 4.4, T-07): applies the catalog entry received in the plan; the
worker has no copy of the catalog. Negative inverts in RGB like sharp."""
from ops.visual_steps import fmt

NAME = 'filter'
CHANNELS = 'rgb'


def video_filters(parameters):
    entry = parameters['_filter']
    if entry['type'] == 'invert':
        return ['lutrgb=r=negval:g=negval:b=negval']
    if entry['type'] != 'matrix':
        raise ValueError(f"unknown filter type {entry['type']}")
    matrix = entry['matrix']
    options = ':'.join(
        f'{out}{src}={fmt(matrix[row][col])}'
        for row, out in enumerate(CHANNELS)
        for col, src in enumerate(CHANNELS)
    )
    return [f'colorchannelmixer={options}']


def audio_filters(parameters):
    return []
