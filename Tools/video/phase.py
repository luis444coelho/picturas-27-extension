"""Phase of the delivery being run (D-82, ADR-019): download, encode or
upload. A failed reply carries it so the user sees where a task failed instead
of the step, which a single filtergraph does not expose (Q-ADD-16)."""

PHASES = ('download', 'encode', 'upload')

_current = None


def reset():
    global _current
    _current = None


def set(name):  # noqa: A001 - module-level setter, read as phase.set(...)
    global _current
    if name not in PHASES:
        raise ValueError(f'unknown phase {name}')
    _current = name


def current():
    return _current
