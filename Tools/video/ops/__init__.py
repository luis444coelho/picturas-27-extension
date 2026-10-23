"""Operation registry of the worker (ADD T-01): each module only turns
parameters into FFmpeg filters (video_filters, audio_filters); business rules
stay in the projects service. Concrete operations are added by later bolts."""
import os

from ops import test_reencode
from ops import trim, remove_audio, speed
from ops import watermark, adjust, filter, resize, orient
from ops import convert

OPERATIONS = {}
OPERATIONS[trim.NAME] = trim
OPERATIONS[remove_audio.NAME] = remove_audio
OPERATIONS[speed.NAME] = speed
OPERATIONS[watermark.NAME] = watermark
OPERATIONS[adjust.NAME] = adjust
OPERATIONS[filter.NAME] = filter
OPERATIONS[resize.NAME] = resize
OPERATIONS[orient.NAME] = orient
OPERATIONS[convert.NAME] = convert

# Test operation of D-37, only with VIDEO_TEST_OPERATIONS=1.
if os.getenv('VIDEO_TEST_OPERATIONS') == '1':
    OPERATIONS[test_reencode.NAME] = test_reencode


def get(name):
    try:
        return OPERATIONS[name]
    except KeyError:
        raise KeyError(f'unknown operation {name}') from None
