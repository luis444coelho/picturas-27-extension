const axios = require("axios");

// Client of the video module of the storage service (imageStorageService /video, ADD T-08).
const VIDEO_STORAGE =
  process.env.VIDEO_STORAGE_URL || "http://img_storage:11000/video";
const URL_EXPIRES = 900; // 15 min (NFR-017)

// Object keys have the form <projectId>/<stage>/<name> in bucket user-<ownerId>.
function objectKey(projectId, stage, name) {
  return `${projectId}/${stage}/${name}`;
}

function parseKey(ownerId, key) {
  const [projectId, stage, name] = String(key).split("/");
  return { userId: String(ownerId), projectId, stage, name };
}

function objectPath(target) {
  return [target.userId, target.projectId, target.stage, target.name]
    .map(encodeURIComponent)
    .join("/");
}

async function ensureBucket(ownerId) {
  await axios.post(
    `${VIDEO_STORAGE}/bucket/${encodeURIComponent(String(ownerId))}`,
  );
}

async function publicWriteUrl(target, contentType) {
  const resp = await axios.post(`${VIDEO_STORAGE}/url/put`, {
    ...target,
    contentType,
    expires: URL_EXPIRES,
    public: true,
  });
  return resp.data.url;
}

async function publicReadUrl(target, responseContentType) {
  const resp = await axios.post(`${VIDEO_STORAGE}/url/get`, {
    ...target,
    responseContentType,
    expires: URL_EXPIRES,
    public: true,
  });
  return resp.data.url;
}

// Returns {contentLength, contentType}, or null when the object does not exist.
async function head(target) {
  try {
    const resp = await axios.head(
      `${VIDEO_STORAGE}/object/${objectPath(target)}`,
    );
    return {
      contentLength: Number(resp.headers["content-length"]),
      contentType: resp.headers["content-type"] || null,
    };
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

// Deleting an object that does not exist is not an error (S3 semantics).
async function remove(target) {
  await axios.delete(`${VIDEO_STORAGE}/object/${objectPath(target)}`);
}

module.exports = {
  URL_EXPIRES,
  objectKey,
  parseKey,
  ensureBucket,
  publicWriteUrl,
  publicReadUrl,
  head,
  remove,
};
