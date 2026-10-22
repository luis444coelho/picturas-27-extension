const jwt = require("jsonwebtoken");

// Authentication of the video routes (ADD T-00): same checks as auth.checkToken,
// with the status codes the video use cases ask for: 401 when the JWT is
// missing, invalid or expired; 403 when the token's user is not the :user of
// the path (without ?share=). auth.checkToken is not changed (rule 2.6).
function reject(res, status, code, message, correlationId) {
  return res
    .status(status)
    .json({ error: { code, message, details: {} }, correlationId });
}

module.exports.checkVideoToken = (req, res, next) => {
  const auth = req.headers["authorization"];
  const token = auth?.startsWith("Bearer ")
    ? auth.slice("Bearer ".length)
    : null;
  const unauthenticated = () =>
    reject(
      res,
      401,
      "UNAUTHENTICATED",
      "Sessão inválida ou expirada. Inicia sessão novamente.",
      req.correlationId,
    );

  if (!token) return unauthenticated();

  jwt.verify(token, process.env.JWT_SECRET_KEY, (e, payload) => {
    if (e || !payload?.id) return unauthenticated();
    if (payload.exp && Date.now() >= payload.exp * 1000)
      return unauthenticated();

    if (!req.query?.share && String(payload.id) !== req.params.user) {
      return reject(
        res,
        403,
        "FORBIDDEN",
        "Não tens permissão para esta operação de vídeo.",
        req.correlationId,
      );
    }

    req.authUserId = String(payload.id);
    next();
  });
};
