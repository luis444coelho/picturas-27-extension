"""B007 stack fixtures; caller supplies and later removes an empty directory."""

import os
import subprocess
import sys

from tests.generate_basic_edit_fixtures import main as basic_fixtures


def main(directory):
    basic_fixtures(directory)
    subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-y', '-i',
                    os.path.join(directory, 'base.mp4'), '-c', 'copy',
                    os.path.join(directory, 'base.mov')], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-y', '-i',
                    os.path.join(directory, 'base.mp4'), '-an', '-c:v', 'copy',
                    os.path.join(directory, 'silent.mp4')], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-y', '-f', 'lavfi', '-i',
                    'testsrc=size=320x240:rate=25:duration=4', '-f', 'lavfi', '-i',
                    'sine=frequency=440:sample_rate=48000:duration=4', '-c:v',
                    'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv444p',
                    '-c:a', 'libmp3lame', '-b:a', '192k',
                    os.path.join(directory, 'incompatible.avi')], check=True)


if __name__ == '__main__':
    main(sys.argv[1])
