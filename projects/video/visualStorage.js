const axios = require("axios");
const storage = require("./storage");

// Internal reads and writes of small objects (first frames, watermark PNGs)
// through the video module of the storage service (ADD T-08).
const VIDEO_STORAGE =
  process.env.VIDEO_STORAGE_URL || "http://img_storage:11000/video";

async function readBytes(target) {
  const resp = await axios.post(`${VIDEO_STORAGE}/url/get`, {
    ...target,
    public: false,
  });
  const file = await axios.get(resp.data.url, { responseType: "arraybuffer" });
  return Buffer.from(file.data);
}

async function writeBytes(target, buffer, contentType) {
  await storage.ensureBucket(target.userId);
  const resp = await axios.post(`${VIDEO_STORAGE}/url/put`, {
    ...target,
    contentType,
    public: false,
  });
  await axios.put(resp.data.url, buffer, {
    headers: { "Content-Type": contentType },
    maxBodyLength: Infinity,
  });
}

module.exports = { readBytes, writeBytes };
