// Periodic routine of the projects service (ADD Q-ADD-14 without batches, D-04,
// D-15, D-41, D-46). Every write is conditional, so a run that overlaps another
// replica, or a reply handled at the same time, does not apply an effect twice.
const SECOND = 1000;
const MINUTE = 60 * SECOND;

const DEFAULTS = {
  fastEveryMs: 60 * SECOND, // D-41
  slowEveryMs: 10 * MINUTE, // deleted projects (D-41)
  orphanLockMs: 60 * SECOND, // ADD T-03
  unpublishedMs: 60 * SECOND, // D-41
  // Above the 3 h x-consumer-timeout of video_operations_queue (D-18, D-41):
  // no delivery can still be running after this long without a transition.
  stuckMs: 3 * 60 * MINUTE + 10 * MINUTE,
  pendingRefundMs: 60 * SECOND, // D-45
  abandonedUploadMs: 900 * SECOND + 300 * SECOND, // D-15, D-41
};

function createMaintenance({
  VideoTask,
  Video,
  Lock,
  Project,
  tasks,
  storage,
  log,
  now = () => new Date(),
  options = {},
}) {
  const cfg = { ...DEFAULTS, ...options };
  const ago = (ms) => new Date(now().getTime() - ms);
  const FINAL = ["completed", "failed", "cancelled"];

  // Slots whose task does not exist after 60 s (crash between acquiring the slot
  // and creating the task), or whose task already ended (crash before release).
  async function releaseOrphanLocks() {
    const locks = await Lock.find({
      createdAt: { $lt: ago(cfg.orphanLockMs) },
    }).lean();
    let released = 0;
    for (const lock of locks) {
      const task = await VideoTask.findById(lock.holder_id).lean();
      if (task && !FINAL.includes(task.status)) continue;
      const result = await Lock.deleteOne({
        _id: lock._id,
        holder_id: lock.holder_id,
      });
      if (result.deletedCount === 1) {
        released += 1;
        log.warn("video.maintenance.lock_released", {
          projectId: String(lock.project_id),
          holderId: String(lock.holder_id),
          reason: task ? "task_final" : "no_task",
        });
      }
    }
    return released;
  }

  // Queued tasks never published (crash or broker down between create and
  // publish): published again with the stored plan (D-41, ADR-004).
  async function republishUnpublished() {
    const pending = await VideoTask.find({
      status: "queued",
      published_at: null,
      createdAt: { $lt: ago(cfg.unpublishedMs) },
    }).lean();
    for (const task of pending) {
      log.warn("video.maintenance.republish", {
        correlationId: task.correlation_id,
        taskId: String(task._id),
      });
      await tasks.publish(task);
    }
    return pending.length;
  }

  // Active tasks without a transition for longer than any delivery can last.
  async function closeStuckTasks() {
    const stuck = await VideoTask.find({
      status: { $in: ["queued", "processing"] },
      status_changed_at: { $lt: ago(cfg.stuckMs) },
    }).lean();
    for (const task of stuck) await tasks.closeStuck(task);
    return stuck.length;
  }

  async function retryPendingRefunds() {
    const pending = await VideoTask.find({
      "refund.state": "pending",
      updatedAt: { $lt: ago(cfg.pendingRefundMs) },
    }).lean();
    for (const task of pending) await tasks.settleRefund(task);
    return pending.length;
  }

  // Upload URL issued but never confirmed nor cancelled (D-15). The record is
  // claimed first (queued → failed), so a late confirmation gets INVALID_STATE
  // instead of a missing object; then the object, then the record (I7).
  async function removeAbandonedUploads() {
    const abandoned = await Video.find({
      status: "queued",
      updatedAt: { $lt: ago(cfg.abandonedUploadMs) },
    }).lean();
    let removed = 0;
    for (const video of abandoned) {
      const claimed = await Video.updateOne(
        { _id: video._id, status: "queued" },
        { $set: { status: "failed" } },
      );
      if (claimed.modifiedCount !== 1) continue;
      await storage.remove(
        storage.parseKey(video.owner_id, video.storage.original_key),
      );
      await Video.deleteOne({ _id: video._id });
      removed += 1;
      log.info("video.maintenance.abandoned_upload_removed", {
        videoId: String(video._id),
        projectId: String(video.project_id),
      });
    }
    return removed;
  }

  // Video resources of projects that no longer exist (ADD T-00; also covers
  // account removal, which deletes every project of the user).
  async function removeDeletedProjects() {
    const ids = new Map();
    for (const model of [Video, VideoTask, Lock]) {
      for (const id of await model.distinct("project_id"))
        ids.set(String(id), id);
    }
    if (ids.size === 0) return 0;

    const existing = await Project.find(
      { _id: { $in: [...ids.values()] } },
      { _id: 1 },
    ).lean();
    const alive = new Set(existing.map((p) => String(p._id)));
    const gone = [...ids.entries()]
      .filter(([key]) => !alive.has(key))
      .map(([, id]) => id);

    for (const projectId of gone) {
      // D-46: an active task is cancelled with refund before anything is removed.
      const active = await VideoTask.find({
        project_id: projectId,
        status: { $in: ["queued", "processing"] },
      }).lean();
      for (const task of active) await tasks.cancelForDeletedProject(task);

      const videos = await Video.find({ project_id: projectId }).lean();
      for (const video of videos) {
        const keys = [
          video.storage?.original_key,
          video.storage?.preview_key,
          video.storage?.thumb_key,
          video.storage?.first_frame_key,
        ].filter(Boolean);
        for (const key of keys)
          await storage.remove(storage.parseKey(video.owner_id, key));
        await Video.deleteOne({ _id: video._id });
      }

      // Final tasks are kept until no delivery can still answer, so a late
      // result can still be found and deleted (ADD T-03); then they go.
      await VideoTask.deleteMany({
        project_id: projectId,
        status: { $in: FINAL },
        status_changed_at: { $lt: ago(cfg.stuckMs) },
        "refund.state": { $ne: "pending" },
      });
      await Lock.deleteMany({ project_id: projectId });

      log.info("video.maintenance.project_resources_removed", {
        projectId: String(projectId),
        videos: videos.length,
        cancelledTasks: active.length,
      });
    }
    return gone.length;
  }

  async function runFast() {
    return {
      orphanLocks: await releaseOrphanLocks(),
      republished: await republishUnpublished(),
      stuck: await closeStuckTasks(),
      refunds: await retryPendingRefunds(),
      abandonedUploads: await removeAbandonedUploads(),
    };
  }

  // One run at a time per kind; errors are logged and the next run tries again.
  function guarded(name, fn) {
    let running = false;
    return async () => {
      if (running) return;
      running = true;
      try {
        await fn();
      } catch (err) {
        log.error("video.maintenance.failed", {
          run: name,
          message: err.message,
        });
      } finally {
        running = false;
      }
    };
  }

  let timers = [];
  function start() {
    const fast = guarded("fast", runFast);
    const slow = guarded("deleted_projects", removeDeletedProjects);
    timers = [
      setInterval(fast, cfg.fastEveryMs),
      setInterval(slow, cfg.slowEveryMs),
    ];
    return timers;
  }

  function stop() {
    timers.forEach(clearInterval);
    timers = [];
  }

  return {
    releaseOrphanLocks,
    republishUnpublished,
    closeStuckTasks,
    retryPendingRefunds,
    removeAbandonedUploads,
    removeDeletedProjects,
    runFast,
    start,
    stop,
  };
}

module.exports = { createMaintenance, DEFAULTS };
