// Daily quota of video operations through the existing endpoints of the users
// service, used as they are (ADD T-04, rule 2.6): GET /:user/process/:n reserves
// (and debits) n credits; POST /:user/process/refund/:k gives k back. There is
// no confirmation step (QUOTA-003). Premium users are never sent here (QUOTA-005).

// GET /:user/process/:n answers 701 both when the quota is exhausted and when
// it fails internally; only this body means "exhausted" (V8). In the error case
// User.update did not run, so nothing was reserved.
const EXHAUSTED_BODY = "No more daily_operations available";

function createQuota({ http, usersUrl, httpsAgent }) {
  const options = { httpsAgent, timeout: 5000, validateStatus: () => true };

  // Reservations of the same runner run one at a time (ADD T-04), so two video
  // requests of one user cannot both pass with credit for one.
  const queues = new Map();
  function serialize(runnerId, fn) {
    const key = String(runnerId);
    const previous = queues.get(key) || Promise.resolve();
    const next = previous.then(fn, fn);
    const tail = next.catch(() => undefined);
    queues.set(key, tail);
    tail.then(() => {
      if (queues.get(key) === tail) queues.delete(key);
    });
    return next;
  }

  // Resolves to true when reserved, false when the quota is exhausted; throws
  // on any other answer (internal error of the users service, network).
  function reserve(runnerId, n) {
    return serialize(runnerId, async () => {
      const resp = await http.get(
        `${usersUrl}${runnerId}/process/${n}`,
        options,
      );
      if (resp.status === 200) return true;
      if (resp.status === 701 && resp.data === EXHAUSTED_BODY) return false;
      throw new Error(`quota reservation failed with status ${resp.status}`);
    });
  }

  async function refund(runnerId, k) {
    const resp = await http.post(
      `${usersUrl}${runnerId}/process/refund/${k}`,
      null,
      options,
    );
    if (resp.status !== 200)
      throw new Error(`quota refund failed with status ${resp.status}`);
  }

  // remaining_operations of GET /:user (UC-VID-014, exception 4).
  async function remaining(runnerId) {
    const resp = await http.get(`${usersUrl}${runnerId}`, options);
    if (resp.status !== 200) return null;
    return resp.data?.remaining_operations ?? null;
  }

  return { reserve, refund, remaining };
}

module.exports = { createQuota, EXHAUSTED_BODY };
