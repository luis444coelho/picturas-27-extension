// Reads a raw request body of one of the given types up to a byte limit. The
// Express of this service predates express.raw (4.17), and body-parser is not
// a direct dependency, so the B005 image upload reads the stream itself.
function readRawBody({ types, limit }) {
  return (req, res, next) => {
    const type = String(req.headers["content-type"] || "").split(";")[0].trim();
    if (!types.includes(type)) return next();
    const declared = Number(req.headers["content-length"]);
    if (Number.isFinite(declared) && declared > limit)
      return next(Object.assign(new Error("too large"), { type: "entity.too.large" }));
    const chunks = [];
    let size = 0;
    let failed = false;
    req.on("data", (chunk) => {
      if (failed) return;
      size += chunk.length;
      if (size > limit) {
        failed = true;
        req.resume();
        next(Object.assign(new Error("too large"), { type: "entity.too.large" }));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (failed) return;
      req.body = Buffer.concat(chunks);
      next();
    });
    req.on("error", (err) => {
      if (failed) return;
      failed = true;
      next(err);
    });
  };
}

module.exports = { readRawBody };
