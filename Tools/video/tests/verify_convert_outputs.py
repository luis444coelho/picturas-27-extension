"""Inspect and play downloaded B007 integration outputs on a reference host.

Usage: python3 Tools/video/tests/verify_convert_outputs.py <results-directory> [vlc-binary]
The script never changes or removes the supplied outputs.
"""

import json
import os
import subprocess
import sys


def main(directory, vlc=None):
    files = sorted(os.path.join(directory, name) for name in os.listdir(directory)
                   if name.endswith(('.mp4', '.mov', '.avi')))
    if len(files) != 18:
        raise AssertionError(f'expected 10 results and 8 previews; found {len(files)}')
    for path in files:
        raw = subprocess.check_output(['ffprobe', '-v', 'error', '-show_error',
                                       '-show_streams', '-show_format', '-of', 'json', path])
        info = json.loads(raw)
        if 'error' in info:
            raise AssertionError((path, info['error']))
        video = next(s for s in info['streams'] if s['codec_type'] == 'video')
        audio = next((s for s in info['streams'] if s['codec_type'] == 'audio'), None)
        extension = os.path.splitext(path)[1]
        wanted = 'mpeg4' if extension == '.avi' else 'h264'
        if video['codec_name'] != wanted:
            raise AssertionError((path, video['codec_name'], wanted))
        wanted_audio = None if 'silent-' in path or 'odd-' in path else ('mp3' if extension == '.avi' else 'aac')
        if (audio['codec_name'] if audio else None) != wanted_audio:
            raise AssertionError((path, audio, wanted_audio))
        subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', path, '-f', 'null', '-'],
                       check=True, capture_output=True)
        if vlc:
            played = subprocess.run([vlc, '--intf', 'dummy', '--vout', 'dummy',
                                     '--aout', 'dummy', '--play-and-exit', '--verbose', '1',
                                     path, 'vlc://quit'], capture_output=True, text=True,
                                    timeout=30)
            if played.returncode:
                raise AssertionError((path, played.returncode, played.stderr[-2000:]))
        print(f'{os.path.basename(path)}: {video["codec_name"]}/'
              f'{audio["codec_name"] if audio else "sem áudio"}, '
              f'{video["width"]}×{video["height"]}, FFprobe/decode'
              f'{"/VLC" if vlc else ""} OK', flush=True)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
