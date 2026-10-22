import os

# Own configuration of the video worker (ADD T-02): the storage address is not
# read from utils/env.py, where IMG_STORAGE_URL comes from RABBITMQ_PASSWORD.
VIDEO_STORAGE_URL = os.getenv('VIDEO_STORAGE_URL', 'http://img_storage:11000/video').rstrip('/')

TMP_ROOT = os.getenv('VIDEO_TMP_ROOT', '/tmp/video')

OPERATIONS_QUEUE = 'video_operations_queue'
REPLIES_QUEUE = 'video_project_queue'

# Must match rabbitMQ/definitions.json exactly, or the declaration is refused
# with PRECONDITION_FAILED (ADD T-03, D-18).
OPERATIONS_QUEUE_ARGUMENTS = {
    'x-queue-type': 'quorum',
    'x-delivery-limit': 1,
    'x-consumer-timeout': 10800000,
    'x-dead-letter-exchange': 'picturas',
    'x-dead-letter-routing-key': REPLIES_QUEUE,
}

# Preview copy encoding (D-19) and thumbnail quality (D-20).
PREVIEW_X264_PRESET = 'veryfast'
PREVIEW_X264_CRF = '23'
PREVIEW_AAC_BITRATE = '128k'
THUMBNAIL_JPEG_QUALITY = '4'
FIRST_FRAME_JPEG_QUALITY = '2'

CHUNK_SIZE = 1024 * 1024
