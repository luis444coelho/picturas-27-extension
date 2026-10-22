"""Resize (ADD 4.5): exact presentation dimensions; the rotation tag is applied
before by autorotate, so the result has rotation 0 (RESIZE-008)."""
NAME = 'resize'


def video_filters(parameters):
    return [f"scale={int(parameters['width'])}:{int(parameters['height'])}", 'setsar=1']


def audio_filters(parameters):
    return []
