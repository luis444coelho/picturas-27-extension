# Pinned to Debian 12 (bookworm): the floating python:3.11-slim tag moved to
# Debian 13 (FFmpeg 7.1). The ADD (section 6) fixes FFmpeg 5.1 on Debian 12 (D-25).
FROM python:3.11-slim-bookworm

# FFmpeg/FFprobe from Debian 12 (ADD section 6, NFR-010).
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ./video .

COPY ./utils ./utils
RUN pip install --no-cache-dir -r ./utils/requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

CMD [ "python", "-u", "video.py" ]
