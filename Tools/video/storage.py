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
        # A body with __len__ makes requests send Content-Length and no
        # Transfer-Encoding: chunked, which presigned S3 PUT URLs refuse (ADD T-03).
        # A plain generator gets both headers, even with Content-Length set.
        resp = requests.put(
            url,
            data=_PumpingFile(path, self._pump),
            headers={'Content-Type': content_type},
            timeout=60,
        )
        resp.raise_for_status()
        return f"{target['projectId']}/{target['stage']}/{target['name']}"


class _PumpingFile:
    """Iterates a file in blocks, serving heartbeats between blocks."""

    def __init__(self, path, pump):
        self._path = path
        self._pump = pump
        self._size = os.path.getsize(path)

    def __len__(self):
        return self._size

    def __iter__(self):
        with open(self._path, 'rb') as src:
            while True:
                chunk = src.read(config.CHUNK_SIZE)
                if not chunk:
                    break
                self._pump()
                yield chunk
