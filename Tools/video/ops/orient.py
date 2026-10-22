"""Orientation (ADD 4.6): clockwise rotation, then the mirrors (RN3)."""
NAME = 'orient'
ROTATIONS = {0: [], 90: ['transpose=1'], 180: ['hflip', 'vflip'], 270: ['transpose=2']}


def video_filters(parameters):
    filters = list(ROTATIONS[parameters.get('rotation', 0)])
    if parameters.get('flipH'):
        filters.append('hflip')
    if parameters.get('flipV'):
        filters.append('vflip')
    return filters


def audio_filters(parameters):
    return []
