const s3 = require("./s3Client");

const INTERNAL_BASE = `http://${process.env.S3_ENDPOINT || "seaweedfs:9000"}`;

function objectParams(userId, projectId, stage, name) {
  return {
    Bucket: `user-${userId}`,
    Key: `${projectId}/${stage}/${name}`,
  };
}

// The SDK presigns with SigV2, which does not sign the host, so the URL stays
// valid after the host is rewritten to the nginx /s3-video/ path (ADD T-08).
function toPublicUrl(url) {
  return url.replace(INTERNAL_BASE, process.env.FRONTEND_URL + "/s3-video");
}

async function getReadUrl({
  userId,
  projectId,
  stage,
  name,
  expires,
  isPublic,
  responseContentType,
}) {
  const params = {
    ...objectParams(userId, projectId, stage, name),
    Expires: expires,
  };
  if (responseContentType) params.ResponseContentType = responseContentType;

  const url = await s3.getSignedUrlPromise("getObject", params);
  return isPublic ? toPublicUrl(url) : url;
}

// The Content-Type is part of the signature: the uploader must send the same value.
async function getWriteUrl({
  userId,
  projectId,
  stage,
  name,
  expires,
  isPublic,
  contentType,
}) {
  const params = {
    ...objectParams(userId, projectId, stage, name),
    Expires: expires,
    ContentType: contentType,
  };

  const url = await s3.getSignedUrlPromise("putObject", params);
  return isPublic ? toPublicUrl(url) : url;
}

// Returns null when the object does not exist.
async function headObject({ userId, projectId, stage, name }) {
  try {
    const head = await s3
      .headObject(objectParams(userId, projectId, stage, name))
      .promise();
    return { contentLength: head.ContentLength, contentType: head.ContentType };
  } catch (error) {
    if (error.code === "NotFound" || error.statusCode === 404) return null;
    throw error;
  }
}

module.exports = { getReadUrl, getWriteUrl, headObject, toPublicUrl };
