const mongoose = require("mongoose");

// Cleanup of watermark marks (D-60, with the team's change): a mark is removed
// only when its project no longer exists, or when, 24 h after its creation, no
// VideoTask and no video recipe refers to it. A mark used by a result stays,
// so the recipe can be reproduced (and reused by the chain presets of B008).
const MIN_AGE_MS = 24 * 60 * 60 * 1000;
const INTERVAL_MS = 60 * 60 * 1000;
const BATCH = 200;

function createWatermarkCleanup({
  VideoWatermark,
  VideoTask,
  Video,
  Project,
  storage,
  log,
  now = () => new Date(),
}) {
  const target = (mark) => ({
    userId: String(mark.owner_id),
    projectId: String(mark.project_id),
    stage: "video_src",
    name: `wm-${mark._id}.png`,
  });

  async function referenced(mark) {
    const id = String(mark._id);
    const objectId = new mongoose.Types.ObjectId(id);
    const [task, video] = await Promise.all([
      VideoTask.exists({
        $or: [
          { "plan.steps.mark.watermarkId": id },
          { "steps.parameters.watermarkId": id },
          { "steps.parameters._mark.watermarkId": id },
        ],
      }),
      Video.exists({
        $or: [
          { "recipe.parameters.watermarkId": id },
          { "recipe.parameters._mark.watermarkId": id },
          { "recipe.parameters.watermarkId": objectId },
        ],
      }),
    ]);
    return Boolean(task || video);
  }

  async function remove(mark, reason) {
    await storage.remove(target(mark));
    await VideoWatermark.deleteOne({ _id: mark._id });
    log.info("video.watermark.removed", {
      watermarkId: String(mark._id),
      projectId: String(mark.project_id),
      reason,
    });
  }

  async function runOnce() {
    const cutoff = new Date(now().getTime() - MIN_AGE_MS);
    let removed = 0;
    let after = null;
    for (;;) {
      const query = { createdAt: { $lt: cutoff } };
      if (after) query._id = { $gt: after };
      const batch = await VideoWatermark.find(query).sort({ _id: 1 }).limit(BATCH).lean();
      if (!batch.length) break;
      for (const mark of batch) {
        after = mark._id;
        try {
          const project = await Project.exists({ _id: mark.project_id });
          if (!project) await remove(mark, "project_deleted");
          else if (!(await referenced(mark))) await remove(mark, "unreferenced");
          else continue;
          removed += 1;
        } catch (err) {
          log.error("video.watermark.cleanup_failed", {
            watermarkId: String(mark._id),
            message: err.message,
          });
        }
      }
    }
    return removed;
  }

  function start() {
    const tick = () =>
      runOnce().catch((err) =>
        log.error("video.watermark.cleanup_failed", { message: err.message }),
      );
    const timer = setInterval(tick, INTERVAL_MS);
    timer.unref?.();
    return timer;
  }

  return { runOnce, start, referenced, MIN_AGE_MS };
}

// Wired by one new line in app.js.
function start() {
  const cleanup = createWatermarkCleanup({
    VideoWatermark: require("../models/videoWatermark"),
    VideoTask: require("../models/videoTask"),
    Video: require("../models/video"),
    Project: require("../models/project"),
    storage: require("./storage"),
    log: require("./log"),
  });
  return cleanup.start();
}

module.exports = { createWatermarkCleanup, start, MIN_AGE_MS };
