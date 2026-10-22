const formats = require("./formats");

// Suggested download name (DOWNLOAD-005, ADD 4.1): original name without its
// extension, the recipe operations in order joined by "_" (D-35, Q-ADD-08) and
// the extension of the stored container, never the one of the MP4 preview copy
// (DOWNLOAD-006). Used by the information and the download endpoints.
function suggestedFileName({ original_name, recipe, meta }) {
  const name = String(original_name || "video");
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;

  const suffix = (recipe || []).map((step) => `_${step.operation}`).join("");

  // Without a container in the metadata, the original name's extension is
  // kept: the upload only accepts names whose extension matches the container
  // (UPLOAD-020).
  const container = formats.CONTAINERS[meta?.container];
  const extension = container
    ? container.extension
    : dot > 0
      ? name.slice(dot).toLowerCase()
      : "";

  return `${base}${suffix}${extension}`;
}

module.exports = { suggestedFileName };
