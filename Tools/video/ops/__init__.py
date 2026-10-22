"""Operation registry of the worker (ADD T-01): each module only turns
parameters into FFmpeg filters (video_filters, audio_filters); business rules
stay in the projects service. Concrete operations are added by later bolts."""
import os

from ops import test_reencode
from ops import trim, remove_audio, speed

OPERATIONS = {}
OPERATIONS[trim.NAME] = trim
OPERATIONS[remove_audio.NAME] = remove_audio
OPERATIONS[speed.NAME] = speed

# Test operation of D-37, only with VIDEO_TEST_OPERATIONS=1.
if os.getenv('VIDEO_TEST_OPERATIONS') == '1':
    OPERATIONS[test_reencode.NAME] = test_reencode


def get(name):
    try:
        return OPERATIONS[name]
    except KeyError:
        raise KeyError(f'unknown operation {name}') from None
