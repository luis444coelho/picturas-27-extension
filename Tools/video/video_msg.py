import datetime
import uuid

import pytz

"""
Video messages (ADD T-02, T-10). Same field names as utils/tool_msg.py
(messageId, correlationId, timestamp, status, output, error, metadata), plus
operation and videoId. correlationId is only the trace id of NFR-002; replies
are matched to the video by videoId and operation.
"""


def now():
    return datetime.datetime.now(pytz.utc)


def build_reply(request, started_at, status, output=None, error=None, preview_requested=None):
    finished_at = now()
    reply = {
        'messageId': str(uuid.uuid4()),
        'correlationId': request.get('correlationId'),
        'timestamp': finished_at.isoformat(),
        'operation': request.get('operation'),
        'videoId': request.get('videoId'),
        'status': status,
        'output': output,
        'error': error,
        'metadata': {
            'processingTime': (finished_at - started_at).total_seconds() * 1000,
        },
    }
    if preview_requested is not None:
        reply['previewRequested'] = preview_requested
    return reply


def success(request, started_at, output, preview_requested=None):
    return build_reply(request, started_at, 'success', output=output, preview_requested=preview_requested)


def failure(request, started_at, code, message):
    return build_reply(request, started_at, 'error', error={'code': code, 'message': message})
