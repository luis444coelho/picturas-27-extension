"""Generate B004 integration fixtures with FFmpeg 5.1 into an explicit directory.

    python -m tests.generate_basic_edit_fixtures /tmp/b004-fixtures-<run>

Never reuse a nonempty directory. The caller owns removal of that directory.
"""
import os
import shutil
import sys
from tests.test_basic_edits import BasicEditFFmpegTest, ffmpeg


def main(directory):
    os.makedirs(directory, exist_ok=True)
    if os.listdir(directory):
        raise ValueError('fixture directory must be empty')
    BasicEditFFmpegTest.setUpClass()
    try:
        for name, source in BasicEditFFmpegTest.fixtures.items():
            shutil.copyfile(source, os.path.join(directory, name))
        shutil.copyfile(BasicEditFFmpegTest.rot, os.path.join(directory, 'rot.mp4'))
        ffmpeg('-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=30:duration=20',
               '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=20',
               '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-c:a', 'aac',
               os.path.join(directory, 'long.mp4'))
        ffmpeg('-f', 'lavfi', '-i', 'color=c=blue:size=64x48', '-frames:v', '1',
               os.path.join(directory, 'image.png'))
    finally:
        BasicEditFFmpegTest.tearDownClass()


if __name__ == '__main__':
    main(sys.argv[1])
