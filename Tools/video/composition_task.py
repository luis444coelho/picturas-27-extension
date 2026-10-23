"""B008 composition path (ADR-017), selected after the B007 conversion path
and before the B003 one-input builder: concats (one -i per clip occurrence,
one sub-graph per clip, the concat filter, then the final steps) and chains of
several steps that end in an AVI conversion (AVI and MP4 preview in the same
invocation, T-06). One FFmpeg invocation per task (NFR-013).

The projects plan owns every decision (T-01): copy or encode, codecs, target
resolution and fps, audio of the concat. This module translates it and reuses
the B003 runner, probe, storage and cancellation hooks.
"""

import os

import config
import executor
import ingest
import ops
import phase
import visual_input
from ops import concat as concat_op
from step_input import with_filter_input

EVEN_CROP = executor.EVEN_CROP


def applies(plan):
    return 'composition' in plan or (
        len(plan['steps']) > 1
        and plan.get('convert', {}).get('previewInSameInvocation', False))


def _filters(steps, kind):
    chain = []
    for step in steps:
        step = with_filter_input(step)
        chain += getattr(ops.get(step['operation']), f'{kind}_filters')(step.get('parameters') or {})
    return chain


def _steps(plan):
    """Steps of every clip and final steps; without a concat, all the steps."""
    composition = plan.get('composition')
    if not composition:
        return [], list(plan['steps'])
    return [clip['steps'] for clip in composition['clips']], list(plan['steps'][1:])


def resolve_visual(plan, work_dir, storage):
    """Filter and watermark extras (ADR-011) of the clips and of the final
    steps, resolved as one flat list so the mark indices never collide."""
    groups, finals = _steps(plan)
    flat = [step for group in groups for step in group] + finals
    if not any(step['operation'] in visual_input.VISUAL for step in flat):
        return groups, finals
    resolved = visual_input.resolve({'steps': flat}, work_dir, storage)['steps']
    out, start = [], 0
    for group in groups:
        out.append(resolved[start:start + len(group)])
        start += len(group)
    return out, resolved[start:]


def _sources(plan, groups, graph):
    """Video and audio labels before the final steps."""
    composition = plan.get('composition')
    audio_mode = plan['output']['audio']['mode']
    if not composition:
        return '[0:V:0]', '[0:a:0]' if audio_mode == 'encode' else None

    target = composition['target']
    with_audio = composition['audio'] == 'concat'
    labels = []
    for index, (clip, steps) in enumerate(zip(composition['clips'], groups)):
        video = _filters(steps, 'video') + concat_op.normalize_video(target)
        graph.append(f"[{index}:V:0]{','.join(video)}[cv{index}]")
        labels.append(f'[cv{index}]')
        if not with_audio:
            continue
        if clip['output']['hasAudio']:
            audio = _filters(steps, 'audio') + [concat_op.AUDIO_FORMAT]
            graph.append(f"[{index}:a:0]{','.join(audio)}[ca{index}]")
        else:
            graph.append(f"{concat_op.silence(clip['output']['durationMs'])}[ca{index}]")
        labels.append(f'[ca{index}]')
    outputs = '[vc][ac]' if with_audio else '[vc]'
    graph.append(''.join(labels) + concat_op.concat_filter(len(groups), with_audio) + outputs)
    return '[vc]', '[ac]' if with_audio else None


def _codec_args(video, audio):
    args = []
    if video['mode'] == 'encode':
        args += ['-c:v', video['codec']]
        if 'quality' in video:  # mpeg4 for AVI (D-68)
            args += ['-q:v', str(video['quality'])]
        else:
            args += ['-preset', video['preset'], '-crf', str(video['crf'])]
        args += ['-pix_fmt', video['pixFmt']]
    else:
        args += ['-c:v', 'copy']
    if audio['mode'] == 'encode':
        args += ['-c:a', audio['codec'], '-b:a', audio['bitrate']]
    elif audio['mode'] == 'copy':
        args += ['-c:a', 'copy']
    return args


def build_command(plan, input_paths, groups, finals, result_path, preview_path=None):
    output = plan['output']
    video, audio = output['video'], output['audio']
    dual = plan.get('convert', {}).get('previewInSameInvocation', False)
    if dual and not preview_path:
        raise ValueError('dual-output chain has no preview path')
    composition = plan.get('composition')

    args = ['ffmpeg', '-hide_banner', '-nostdin', '-y', '-v', 'error']
    if output.get('genpts'):
        args += ['-fflags', '+genpts']
    if composition:
        # A repeated clip is one downloaded file passed as several inputs (ADD 4.8).
        for clip in composition['clips']:
            args += ['-i', input_paths[clip['file']]]
    else:
        args += ['-i', input_paths[0]]

    graph = []
    vsrc, asrc = _sources(plan, groups, graph)

    if video['mode'] == 'encode':
        chain = _filters(finals, 'video') + ([EVEN_CROP] if video.get('evenCrop') else [])
        body = ','.join(chain) or 'null'
        graph.append(f'{vsrc}{body},split=2[vout][vprev]' if dual else f'{vsrc}{body}[vout]')
        vmap = '[vout]'
    else:
        vmap = '0:V:0'
        if dual:
            graph.append(f'[0:V:0]{EVEN_CROP}[vprev]')

    amap = None
    if audio['mode'] == 'encode' and asrc:
        body = ','.join(_filters(finals, 'audio')) or 'anull'
        graph.append(f'{asrc}{body},asplit=2[aout][aprev]' if dual else f'{asrc}{body}[aout]')
        amap = '[aout]'
    elif audio['mode'] == 'copy':
        amap = '0:a:0'
        if dual:
            graph.append('[0:a:0]anull[aprev]')

    if graph:
        args += ['-filter_complex', ';'.join(graph)]
    args += ['-progress', 'pipe:1', '-nostats', '-map', vmap]
    if amap:
        args += ['-map', amap]
    args += ['-sn', '-dn'] + _codec_args(video, audio)
    if output.get('faststart'):
        args += ['-movflags', '+faststart']
    args += [result_path]

    if dual:
        # Browser-compatible MP4 from the same frames, like the isolated AVI
        # conversion (convert_task, ADR-013).
        preview = plan['preview']['whenIncompatible']
        if preview['video'] != 'libx264' or preview.get('audio') not in ('aac', None):
            raise ValueError('unsupported AVI preview instructions')
        if (amap is None) != (preview.get('audio') is None):
            raise ValueError('AVI preview audio does not match the output plan')
        args += ['-map', '[vprev]']
        if amap:
            args += ['-map', '[aprev]']
        args += ['-sn', '-dn', '-c:v', preview['video'],
                 '-preset', config.PREVIEW_X264_PRESET,
                 '-crf', config.PREVIEW_X264_CRF,
                 '-pix_fmt', plan['preview']['browserProfile']['pixFmt']]
        if amap:
            args += ['-c:a', preview['audio'], '-b:a', config.PREVIEW_AAC_BITRATE]
        args += ['-movflags', '+faststart', preview_path]
    return args


def execute(runner, request, plan, input_paths, work_dir):
    task_id = str(request['taskId'])
    pump = runner._tick

    phase.set('download')  # watermark images (D-82)
    groups, finals = resolve_visual(plan, work_dir, runner._storage)

    phase.set('encode')
    container = plan['output']['container']
    result_path = os.path.join(work_dir, f'result.{container}')
    dual = plan.get('convert', {}).get('previewInSameInvocation', False)
    preview_path = os.path.join(work_dir, 'preview.mp4') if dual else None
    cmd = build_command(plan, input_paths, groups, finals, result_path, preview_path)
    # One encoding invocation per task, visible in the logs (NFR-013).
    runner._log('info', 'video.task.ffmpeg', correlationId=request.get('correlationId'),
                taskId=task_id, command=' '.join(cmd))
    executor.run(
        cmd, work_dir, plan.get('expectedDurationMs'),
        wait=runner._wait, on_progress=runner._reporter.update,
        is_cancelled=lambda: task_id in runner._control.cancelled,
    )
    runner._reporter.update(99)

    # Metadata of the result always come from the real file (ADD T-02).
    probed = ingest.probe(result_path, pump)
    thumb_path = os.path.join(work_dir, 'thumb.jpg')
    frame_path = os.path.join(work_dir, 'frame0.jpg')
    thumbnail = plan['thumbnail']
    ingest.thumbnail(result_path, thumb_path, thumbnail['atMs'], thumbnail['maxWidth'], pump)
    ingest.first_frame(result_path, frame_path, plan['firstFrameMaxWidth'], pump)

    if not dual:
        preview_plan = runner._preview_plan(plan.get('preview'), probed)
        if preview_plan:
            preview_path = os.path.join(work_dir, 'preview.mp4')
            ingest.preview(result_path, preview_path, preview_plan, pump)

    phase.set('upload')
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
