import os
import subprocess

import ingest
import ops
from step_input import with_filter_input

"""
Chain executor (ADD T-02): turns the execution plan computed by the projects
service into a single FFmpeg invocation with one -filter_complex, so a chain
encodes the video at most once (NFR-013). It does not decide copy or encode:
the plan does.
"""

EVEN_CROP = 'crop=trunc(iw/2)*2:trunc(ih/2)*2'
KILL_AFTER_S = 5


class Cancelled(Exception):
    """The task was cancelled while running (TASK-005)."""


def _filters(plan, kind):
    chain = []
    for step in plan['steps']:
        step = with_filter_input(step)
        module = ops.get(step['operation'])
        chain += getattr(module, f'{kind}_filters')(step.get('parameters') or {})
    return chain


def build_command(plan, input_paths, out_path):
    output = plan['output']
    video, audio = output['video'], output['audio']

    args = ['ffmpeg', '-hide_banner', '-nostdin', '-y', '-v', 'error']
    if output.get('genpts'):
        args += ['-fflags', '+genpts']
    for path in input_paths:
        args += ['-i', path]

    graph, maps = [], []
    if video['mode'] == 'encode':
        chain = _filters(plan, 'video') + ([EVEN_CROP] if video.get('evenCrop') else [])
        graph.append(f"[0:V:0]{','.join(chain) or 'null'}[v]")
        maps += ['-map', '[v]']
    else:
        maps += ['-map', '0:V:0']

    if audio['mode'] == 'encode':
        chain = _filters(plan, 'audio')
        graph.append(f"[0:a:0]{','.join(chain) or 'anull'}[a]")
        maps += ['-map', '[a]']
    elif audio['mode'] == 'copy':
        maps += ['-map', '0:a:0']

    if graph:
        args += ['-filter_complex', ';'.join(graph)]
    args += maps + ['-sn', '-dn']

    if video['mode'] == 'encode':
        args += ['-c:v', video['codec'], '-preset', video['preset'], '-crf', str(video['crf']),
                 '-pix_fmt', video['pixFmt']]
    else:
        args += ['-c:v', 'copy']

    if audio['mode'] == 'encode':
        args += ['-c:a', audio['codec'], '-b:a', audio['bitrate']]
    elif audio['mode'] == 'copy':
        args += ['-c:a', 'copy']

    if output.get('faststart'):
        args += ['-movflags', '+faststart']
    args += ['-progress', 'pipe:1', '-nostats', out_path]
    return args


def percent(out_time_us, expected_ms):
    """Encoding progress, at most 99 until the reply says completed (NFR-009)."""
    if not expected_ms or out_time_us <= 0:
        return 0
    return max(0, min(99, int(out_time_us / (expected_ms * 1000) * 100)))


class ProgressParser:
    """Reads the key=value lines of -progress pipe:1. out_time_us is in
    microseconds (out_time_ms too, despite its name) (ADD T-02)."""

    def __init__(self):
        self._buffer = b''
        self.out_time_us = 0

    def feed(self, data):
        self._buffer += data
        *lines, self._buffer = self._buffer.split(b'\n')
        for line in lines:
            key, _, value = line.decode(errors='replace').strip().partition('=')
            if key == 'out_time_us':
                try:
                    self.out_time_us = max(self.out_time_us, int(value))
                except ValueError:
                    pass  # N/A before the first frame


def run(cmd, work_dir, expected_ms, wait, on_progress, is_cancelled):
    """Runs FFmpeg in its own process and follows it from the main thread
    (ADD T-03): wait() serves heartbeats and control messages for up to 0.5 s,
    progress is read without blocking, and a cancellation ends FFmpeg."""
    stderr_path = os.path.join(work_dir, 'ffmpeg.stderr')
    with open(stderr_path, 'wb') as stderr:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=stderr)
    fd = proc.stdout.fileno()
    os.set_blocking(fd, False)
    parser = ProgressParser()

    def drain():
        while True:
            try:
                data = os.read(fd, 65536)
            except BlockingIOError:
                return
            if not data:
                return
            parser.feed(data)

    try:
        while True:
            wait(0.5)
            drain()
            on_progress(percent(parser.out_time_us, expected_ms))
            if is_cancelled():
                proc.terminate()
                try:
                    proc.wait(timeout=KILL_AFTER_S)
                except subprocess.TimeoutExpired:
                    proc.kill()
                    proc.wait()
                raise Cancelled()
            if proc.poll() is not None:
                drain()
                break
    finally:
        proc.stdout.close()
        if proc.poll() is None:
            proc.kill()
            proc.wait()

    if proc.returncode != 0:
        with open(stderr_path, 'rb') as stderr:
            raise ingest.ProcessFailed(ingest._tail(stderr.read().decode(errors='replace')))
