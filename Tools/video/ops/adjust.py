"""Adjust (ADD 4.3, D-67/ADR-012), in RGB like the sharp preview and the image
tools (DQ-020): multiplicative brightness with colorchannelmixer (Q-ADD-23),
contrast as a line through the fixed pivot 128 with lutrgb (Q-ADD-18), and
saturation as a mix with the BT.601 luma (PIL ImageEnhance.Color) as a matrix."""
from ops.visual_steps import fmt, normalize

NAME = 'adjust'
STEP = 0.05
LUMA = (0.299, 0.587, 0.114)
CHANNELS = 'rgb'


def saturation_matrix(s):
    return [[LUMA[col] * (1 - s) + (s if row == col else 0) for col in range(3)] for row in range(3)]


def video_filters(parameters):
    brightness = normalize(parameters['brightness'], STEP)
    contrast = normalize(parameters['contrastFactor'], STEP)
    saturation = normalize(parameters['saturationFactor'], STEP)
    filters = []
    if brightness != 1:
        b = fmt(brightness)
        filters.append(f'colorchannelmixer=rr={b}:gg={b}:bb={b}')
    if contrast != 1:
        # lutrgb clips the result to 0..255; no commas, so the chain stays linear.
        line = f'val*{fmt(contrast)}{128 * (1 - contrast):+.6g}'
        filters.append(f'lutrgb=r={line}:g={line}:b={line}')
    if saturation != 1:
        matrix = saturation_matrix(saturation)
        filters.append('colorchannelmixer=' + ':'.join(
            f'{out}{src}={fmt(matrix[row][col])}'
            for row, out in enumerate(CHANNELS) for col, src in enumerate(CHANNELS)))
    return filters


def audio_filters(parameters):
    return []
