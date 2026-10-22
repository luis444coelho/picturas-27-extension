import os

import requests

import config


class StorageClient:
    """Client of the video module of the storage service (ADD T-08).

    URLs are requested when they are needed: read URLs when a trip starts and
    write URLs only after FFmpeg ends, so they never expire in the queue.
    Transfers go in blocks and call pump() between blocks, so RabbitMQ
    heartbeats keep being served during multi-GB transfers (ADD T-03).
    """

    def __init__(self, pump, base_url=config.VIDEO_STORAGE_URL):
        self._pump = pump
        self._base_url = base_url

    def _url(self, kind, target, **extra):
        body = {
            'userId': target['userId'],
            'projectId': target['projectId'],
            'stage': target['stage'],
            'name': target['name'],
            'public': False,
            **extra,
        }
        resp = requests.post(f'{self._base_url}/url/{kind}', json=body, timeout=30)
        resp.raise_for_status()
        return resp.json()['url']

    def download(self, source, path):
        url = self._url('get', source)
        with requests.get(url, stream=True, timeout=60) as resp:
            resp.raise_for_status()
            with open(path, 'wb') as out:
                for chunk in resp.iter_content(chunk_size=config.CHUNK_SIZE):
                    out.write(chunk)
                    self._pump()

    def upload(self, target, path, content_type):
        url = self._url('put', target, contentType=content_type)
        size = os.path.getsize(path)

        def blocks():
            with open(path, 'rb') as src:
                while True:
                    chunk = src.read(config.CHUNK_SIZE)
                    if not chunk:
                        break
                    self._pump()
                    yield chunk

        # Content-Length is required: without it requests sends a chunked body,
        # which presigned S3 PUT URLs do not accept.
        resp = requests.put(
            url,
            data=blocks(),
            headers={'Content-Type': content_type, 'Content-Length': str(size)},
            timeout=60,
        )
        resp.raise_for_status()
        return f"{target['projectId']}/{target['stage']}/{target['name']}"
