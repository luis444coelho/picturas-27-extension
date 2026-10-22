"""Decimal step grid shared with the projects service (ADD 4.3)."""


def normalize(value, step):
    return round(value / step) * step


def fmt(value):
    return f'{value:.6g}'
