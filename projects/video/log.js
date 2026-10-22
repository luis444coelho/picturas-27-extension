// JSON log lines on stdout for the video code (ADD T-10). Never pass JWTs or
// presigned URLs in the fields.
function log(level, event, fields = {}) {
  const line = {
    level,
    event,
    service: "projects",
    time: new Date().toISOString(),
    ...fields,
  };
  const out = level === "error" ? console.error : console.log;
  out(JSON.stringify(line));
}

module.exports = {
  info: (event, fields) => log("info", event, fields),
  warn: (event, fields) => log("warn", event, fields),
  error: (event, fields) => log("error", event, fields),
};
