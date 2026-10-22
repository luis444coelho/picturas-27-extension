const axios = require("axios");
const { httpsAgent } = require("../utils/httpsAgent");

const USERS_MS = process.env.USERS_MS || "https://users:10001/";

// Profile type of a user (anonymous | free | premium), from the users service.
// Unlike utils/presence.js, a failure is not mapped to a default type: the
// caller decides how to fail.
async function getUserType(userId) {
  const resp = await axios.get(`${USERS_MS}${userId}/type`, {
    httpsAgent,
    timeout: 5000,
  });
  return resp.data?.type ?? null;
}

module.exports = { getUserType };
