"""B007 isolated conversion path, selected before the B003 one-output builder.

The projects plan owns codec, copy/encode and dual-output decisions. This
module translates those decisions into FFmpeg arguments and reuses the B003
runner, probe, storage and cancellation hooks (ADR-013).
"""

import os

import config
import executor
import ingest


EVEN_CROP = executor.EVEN_CROP


def applies(plan):
    return (len(plan['steps']) == 1 and
            plan['steps'][0]['operation'] == 'convert')


def _base(plan, input_path):
    args = ['ffmpeg', '-hide_banner', '-nostdin', '-y', '-v', 'error']
    if plan['output'].get('genpts'):
        args += ['-fflags', '+genpts']
    return args + ['-i', input_path]


def _single_command(plan, input_path, result_path):
    """MP4/MOV: one result; its preview may be remuxed afterwards."""
    output = plan['output']
    video, audio = output['video'], output['audio']
    args = _base(plan, input_path)
    graph = []

    if video['mode'] == 'encode':
        graph.append(f'[0:V:0]{EVEN_CROP}[v]')
    if audio['mode'] == 'encode':
        graph.append('[0:a:0]anull[a]')
    if graph:
        args += ['-filter_complex', ';'.join(graph)]

    args += ['-map', '[v]' if video['mode'] == 'encode' else '0:V:0']
    if audio['mode'] != 'none':
        args += ['-map', '[a]' if audio['mode'] == 'encode' else '0:a:0']
    args += ['-sn', '-dn']

    if video['mode'] == 'encode':
        args += ['-c:v', video['codec'], '-preset', video['preset'],
                 '-crf', str(video['crf']), '-pix_fmt', video['pixFmt'],
                 '-fps_mode', 'passthrough']
    else:
        args += ['-c:v', 'copy']
    if audio['mode'] == 'encode':
        args += ['-c:a', audio['codec'], '-b:a', audio['bitrate']]
    elif audio['mode'] == 'copy':
        args += ['-c:a', 'copy']
    if output.get('faststart'):
        args += ['-movflags', '+faststart']
    return args + ['-progress', 'pipe:1', '-nostats', result_path]


def _avi_command(plan, input_path, result_path, preview_path):
    """AVI and MP4 preview share one decoding/filtergraph (ADD T-06)."""
    output = plan['output']
    video, audio = output['video'], output['audio']
    preview = plan['preview']['whenIncompatible']
    if preview['video'] != 'libx264' or preview.get('audio') not in ('aac', None):
        raise ValueError('unsupported AVI preview instructions')
    if (audio['mode'] == 'none') != (preview.get('audio') is None):
        raise ValueError('AVI preview audio does not match the output plan')
    args = _base(plan, input_path)
    graph = []
    if video['mode'] == 'encode':
        graph.append(f'[0:V:0]{EVEN_CROP},split=2[vavi][vprev]')
    else:
        graph.append(f'[0:V:0]{EVEN_CROP}[vprev]')
    if audio['mode'] == 'encode':
        graph.append('[0:a:0]asplit=2[aavi][aprev]')
    elif audio['mode'] == 'copy':
        graph.append('[0:a:0]anull[aprev]')
    args += ['-filter_complex', ';'.join(graph), '-progress', 'pipe:1', '-nostats']

    # First output: fixed AVI matrix, with stream copy only if the plan allows.
    args += ['-map', '[vavi]' if video['mode'] == 'encode' else '0:V:0']
    if audio['mode'] != 'none':
        args += ['-map', '[aavi]' if audio['mode'] == 'encode' else '0:a:0']
    args += ['-sn', '-dn']
    if video['mode'] == 'encode':
        args += ['-c:v', video['codec'], '-q:v', str(video['quality']),
                 '-pix_fmt', video['pixFmt'], '-fps_mode', 'passthrough']
    else:
        args += ['-c:v', 'copy']
    if audio['mode'] == 'encode':
        args += ['-c:a', audio['codec'], '-b:a', audio['bitrate']]
    elif audio['mode'] == 'copy':
        args += ['-c:a', 'copy']
    args += [result_path]

    # Second output: browser-compatible MP4 from the same post-filter frames.
    args += ['-map', '[vprev]']
    if audio['mode'] != 'none':
        args += ['-map', '[aprev]']
    args += ['-sn', '-dn', '-c:v', preview['video'],
             '-preset', config.PREVIEW_X264_PRESET,
             '-crf', config.PREVIEW_X264_CRF,
             '-pix_fmt', plan['preview']['browserProfile']['pixFmt'],
             '-fps_mode', 'passthrough']
    if audio['mode'] != 'none':
        args += ['-c:a', preview['audio'], '-b:a', config.PREVIEW_AAC_BITRATE]
    args += ['-movflags', '+faststart', preview_path]
    return args


def build_command(plan, input_path, result_path, preview_path=None):
    if plan.get('convert', {}).get('previewInSameInvocation'):
        if not preview_path or not plan.get('targets', {}).get('preview'):
            raise ValueError('dual-output conversion has no preview target')
        return _avi_command(plan, input_path, result_path, preview_path)
    return _single_command(plan, input_path, result_path)


def execute(runner, request, plan, input_paths, work_dir):
    task_id = str(request['taskId'])
    pump = runner._tick
    container = plan['output']['container']
    result_path = os.path.join(work_dir, f'result.{container}')
    dual = plan.get('convert', {}).get('previewInSameInvocation', False)
    preview_path = os.path.join(work_dir, 'preview.mp4') if dual else None
    cmd = build_command(plan, input_paths[0], result_path, preview_path)
    runner._log('info', 'video.task.ffmpeg',
                correlationId=request.get('correlationId'), taskId=task_id,
                command=' '.join(cmd))
    executor.run(
        cmd, work_dir, plan.get('expectedDurationMs'),
        wait=runner._wait, on_progress=runner._reporter.update,
        is_cancelled=lambda: task_id in runner._control.cancelled,
    )
    runner._reporter.update(99)

    probed = ingest.probe(result_path, pump)
    thumb_path = os.path.join(work_dir, 'thumb.jpg')
    frame_path = os.path.join(work_dir, 'frame0.jpg')
    thumbnail = plan['thumbnail']
    ingest.thumbnail(result_path, thumb_path, thumbnail['atMs'],
                     thumbnail['maxWidth'], pump)
    ingest.first_frame(result_path, frame_path, plan['firstFrameMaxWidth'], pump)

    if not dual:
        preview_plan = runner._preview_plan(plan.get('preview'), probed)
        if preview_plan:
            preview_path = os.path.join(work_dir, 'preview.mp4')
            ingest.preview(result_path, preview_path, preview_plan, pump)

    targets = plan['targets']
    original = targets['original']
    keys = {
        'original': runner._storage.upload(original, result_path, original['contentType']),
        'thumb': runner._storage.upload(targets['thumb'], thumb_path, 'image/jpeg'),
        'firstFrame': runner._storage.upload(targets['firstFrame'], frame_path, 'image/jpeg'),
    }
    if preview_path:
        keys['preview'] = runner._storage.upload(targets['preview'], preview_path, 'video/mp4')
    return {'meta': probed['meta'], 'stream': probed['stream'], 'keys': keys,
            'previewMade': preview_path is not None}
