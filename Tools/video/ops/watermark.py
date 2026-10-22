"""Watermark (UC-VID-004, Q-ADD-12, D-59): the mark PNG (image or rendered
text) is overlaid at a fixed position on every frame. The executor builds one
linear chain, so the step closes it with a label, opens the mark source and
continues the chain from the overlay: a valid -filter_complex in one graph."""
from ops.visual_steps import fmt

NAME = 'watermark'


def video_filters(parameters):
    mark = parameters['_overlay']
    index = int(mark['index'])
    path = mark['path']
    if any(char in path for char in "':;,[]\\"):
        raise ValueError('unsafe watermark path')
    base, layer = f'wmbase{index}', f'wmlayer{index}'
    return [
        f'null[{base}];'
        f"movie=filename={path},format=rgba,"
        f"scale={int(mark['width'])}:{int(mark['height'])},"
        f"colorchannelmixer=aa={fmt(mark['opacity'])}[{layer}];"
        f"[{base}][{layer}]overlay={int(mark['x'])}:{int(mark['y'])}:eof_action=repeat"
    ]


def audio_filters(parameters):
    return []
