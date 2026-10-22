"""Bridge of the B005 plan extras (ADR-011) to the one-argument filter API of
the operation modules: a local copy of the plan where the filter steps carry
the catalog entry and the watermark steps the downloaded mark. The plan and
the recipe are never changed; a value sent by the client cannot prevail."""
import copy
import os

VISUAL = ('filter', 'watermark')


def needed(plan):
    return any(step['operation'] in VISUAL for step in plan['steps'])


def resolve(plan, work_dir, storage):
    resolved = copy.deepcopy(plan)
    for index, step in enumerate(resolved['steps']):
        parameters = dict(step.get('parameters') or {})
        parameters.pop('_filter', None)
        parameters.pop('_overlay', None)
        if step['operation'] == 'filter':
            entry = step.get('filter')
            if not isinstance(entry, dict) or entry.get('type') not in ('matrix', 'invert'):
                raise ValueError('filter requires the catalog entry in step.filter')
            parameters['_filter'] = entry
        elif step['operation'] == 'watermark':
            mark = step.get('mark')
            if not isinstance(mark, dict) or not isinstance(mark.get('source'), dict):
                raise ValueError('watermark requires step.mark with its source')
            path = os.path.join(work_dir, f'mark{index}.png')
            storage.download(mark['source'], path)
            parameters['_overlay'] = {
                'index': index,
                'path': path,
                'x': mark['x'],
                'y': mark['y'],
                'width': mark['width'],
                'height': mark['height'],
                'opacity': mark['opacity'],
            }
        step['parameters'] = parameters
    return resolved
