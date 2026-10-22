"""The plan discards audio mappings; the video stream needs no filter."""
NAME = 'remove_audio'


def video_filters(parameters):
    return []


def audio_filters(parameters):
    return []
