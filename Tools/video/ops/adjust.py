"""Adjust (ADD 4.3): multiplicative brightness with colorchannelmixer (Q-ADD-23),
then contrast with a fixed pivot (Q-ADD-18) and saturation with eq."""
from ops.visual_steps import fmt, normalize

NAME = 'adjust'
STEP = 0.05


def video_filters(parameters):
    brightness = normalize(parameters['brightness'], STEP)
    contrast = normalize(parameters['contrastFactor'], STEP)
    saturation = normalize(parameters['saturationFactor'], STEP)
    filters = []
    if brightness != 1:
        b = fmt(brightness)
        filters.append(f'colorchannelmixer=rr={b}:gg={b}:bb={b}')
    if contrast != 1:
        filters.append(f'eq=contrast={fmt(contrast)}')
    if saturation != 1:
        filters.append(f'eq=saturation={fmt(saturation)}')
    return filters


def audio_filters(parameters):
    return []
