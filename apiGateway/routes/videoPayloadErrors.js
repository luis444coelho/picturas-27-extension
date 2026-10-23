const crypto = require("crypto");

// D-88 (a): without fixed limits of steps or clips (D-86), the size of a
// composition request is bounded by the JSON body limit of express.json()
// (100 kB, unchanged). A body over the limit fails in the parser, before any
// router; for the video routes this error middleware answers in the video
// error format (ADD T-10). Every other error goes on to the existing handler.
const VIDEO_PATH = /^\/projects\/[^/]+\/[^/]+\/videos(\/|$)/;

module.exports = function videoPayloadErrors(err, req, res, next) {
  if (err?.type !== "entity.too.large" || !VIDEO_PATH.test(req.path))
    return next(err);
  return res.status(422).json({
    error: {
      code: "INVALID_REQUEST",
      message: "Pedido inválido. Verifica os dados enviados.",
      details: { field: "steps", reason: "too_large" },
    },
    correlationId: crypto.randomUUID(),
  });
};
