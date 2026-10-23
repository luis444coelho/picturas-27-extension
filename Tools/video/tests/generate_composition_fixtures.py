"""B008 stack fixtures with FFmpeg 5.1, into an explicit empty directory:

    python -m tests.generate_composition_fixtures /tmp/b008-e2e-fixtures

odd.mp4: 321x241, 25 fps, mono audio, 2 s (odd first clip)
wide.mp4: 640x360, 25 fps, stereo audio, 3 s (16:9)
tall.mp4: 360x640, 30 fps, no audio, 2 s (9:16)
phone.mp4: coded 640x360 with a rotation tag, displayed 360x640, 30 fps, audio, 2 s
long.mp4: 640x360, 25 fps, audio, 90 s (limits of the Registered profile, cancellation)
mark.png: 64x32 red image for the image watermark

The caller owns removal of the directory.
"""
import os
import subprocess
import sys


def ffmpeg(*args):
    subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-y', *args], check=True)


def main(directory):
    os.makedirs(directory, exist_ok=True)
    if os.listdir(directory):
        raise ValueError('fixture directory must be empty')
    d = lambda name: os.path.join(directory, name)  # noqa: E731
    h264 = ['-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p']
    ffmpeg('-f', 'lavfi', '-i', 'testsrc2=size=321x241:rate=25:duration=2',
           '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100:duration=2',
           *h264, '-c:a', 'aac', '-ac', '1', d('odd.mp4'))
    ffmpeg('-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=25:duration=3',
           '-f', 'lavfi', '-i', 'sine=frequency=660:sample_rate=48000:duration=3',
           *h264, '-c:a', 'aac', '-ac', '2', d('wide.mp4'))
    ffmpeg('-f', 'lavfi', '-i', 'testsrc2=size=360x640:rate=30:duration=2', *h264, d('tall.mp4'))
    ffmpeg('-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30:duration=2',
           '-f', 'lavfi', '-i', 'sine=frequency=880:sample_rate=48000:duration=2',
           *h264, '-c:a', 'aac', d('landscape.mp4'))
    # FFmpeg 5.1: rotate=270 gives a portrait phone video (B001 rotation 90).
    ffmpeg('-i', d('landscape.mp4'), '-c', 'copy', '-metadata:s:v:0', 'rotate=270', d('phone.mp4'))
    os.remove(d('landscape.mp4'))
    ffmpeg('-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=25:duration=90',
           '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=90',
           *h264, '-c:a', 'aac', d('long.mp4'))
    ffmpeg('-f', 'lavfi', '-i', 'color=c=red:size=64x32', '-frames:v', '1', d('mark.png'))


if __name__ == '__main__':
    main(sys.argv[1])
