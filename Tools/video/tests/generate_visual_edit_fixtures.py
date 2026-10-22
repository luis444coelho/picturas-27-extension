"""Generate B005 integration fixtures with FFmpeg 5.1 into an explicit directory.

    python -m tests.generate_visual_edit_fixtures /tmp/b005-fixtures-<run>

Never reuse a nonempty directory. The caller owns removal of that directory.
"""
import os
import random
import struct
import sys
import zlib

from tests.test_basic_edits import ffmpeg

QUAD = ("nullsrc=size={size}:rate=25:duration={duration},format=rgb24,"
        "geq=r='if(lt(X,W/2),if(lt(Y,H/2),255,0),if(lt(Y,H/2),0,255))':"
        "g='if(lt(X,W/2),0,255)':b='if(lt(Y,H/2),0,255)'")


def video(directory, name, size, acodec, duration=2, extra=()):
    ffmpeg('-f', 'lavfi', '-i', QUAD.format(size=size, duration=duration),
           '-f', 'lavfi', '-i', f'sine=frequency=440:sample_rate=48000:duration={duration}',
           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', '-pix_fmt', 'yuv420p',
           '-c:a', acodec, '-shortest', *extra, os.path.join(directory, name))


def noise_png(path, width, height):
    """An incompressible RGB PNG (> 1 MB) without extra dependencies."""
    rng = random.Random(5)
    rows = b''.join(b'\x00' + bytes(rng.getrandbits(8) for _ in range(width * 3)) for _ in range(height))

    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))

    header = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    with open(path, 'wb') as out:
        out.write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', header) + chunk(b'IDAT', zlib.compress(rows, 9))
                  + chunk(b'IEND', b''))


def main(directory):
    os.makedirs(directory, exist_ok=True)
    if os.listdir(directory):
        raise ValueError('fixture directory must be empty')
    video(directory, 'quad.mp4', '320x240', 'aac')
    video(directory, 'quad.avi', '320x240', 'libmp3lame')
    video(directory, 'odd.mp4', '322x242', 'aac', extra=('-vf', 'crop=321:241:0:0', '-pix_fmt', 'yuv444p'))
    ffmpeg('-i', os.path.join(directory, 'quad.mp4'), '-c', 'copy', '-metadata:s:v:0', 'rotate=270',
           os.path.join(directory, 'portrait.mp4'))
    ffmpeg('-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=30:duration=60',
           '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=60',
           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-c:a', 'aac',
           os.path.join(directory, 'long.mp4'))
    ffmpeg('-f', 'lavfi', '-i', 'color=c=blue:size=64x48', '-frames:v', '1',
           os.path.join(directory, 'image.png'))
    ffmpeg('-f', 'lavfi', '-i', 'color=c=magenta:size=40x20', '-frames:v', '1', '-pix_fmt', 'rgba',
           os.path.join(directory, 'logo.png'))
    ffmpeg('-f', 'lavfi', '-i', 'color=c=yellow:size=120x60', '-frames:v', '1',
           os.path.join(directory, 'photo.jpg'))
    ffmpeg('-f', 'lavfi', '-i', 'color=c=red:size=16x16', '-frames:v', '1',
           os.path.join(directory, 'anim.gif'))
    noise_png(os.path.join(directory, 'big.png'), 700, 700)


if __name__ == '__main__':
    main(sys.argv[1])
