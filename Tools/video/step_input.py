"""Bridge server-owned step input to the unchanged one-argument filter API."""


def with_filter_input(step):
    if step['operation'] != 'speed':
        return step
    source = step.get('input')
    if not isinstance(source, dict) or any(
        type(source.get(key)) is not int or source[key] <= 0
        for key in ('fpsNum', 'fpsDen')
    ):
        raise ValueError('speed requires positive integer fpsNum/fpsDen in step.input')
    # Copy locally: never mutate the plan/recipe; client _input cannot prevail.
    parameters = {**(step.get('parameters') or {}), '_input': dict(source)}
    return {**step, 'parameters': parameters}
