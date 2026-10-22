const crypto = require("crypto");
const mongoose = require("mongoose");

const formats = require("./formats");
const profiles = require("./profiles");
const display = require("./display");
const chain = require("./chain");
const plans = require("./plan");
const { VideoError, MESSAGES } = require("./errors");
const { DUPLICATE_KEY } = require("./locks");

// Video tasks (ADD T-01, T-03, T-04): acceptance in 11 steps, query,
// cancellation and the worker replies on video_project_queue. Every effect is
// guarded by a conditional write on the task status, so replies redelivered or
// late, and the maintenance routine, never apply an effect twice (ADR-004).
const OPERATION = "task.run";
const ACTIVE = ["queued", "processing"];

function createTasks({
  VideoTask,
  Video,
  locks,
  quota,
  bus,
  users,
  storage,
  registry,
  log,
  now = () => new Date(),
}) {
  // ---- helpers ------------------------------------------------------------

  function view(task) {
    const body = {
      taskId: String(task._id),
      status: task.status,
      kind: task.kind,
      step: task.step,
      totalSteps: task.total_steps,
      progress: task.progress,
      cost: task.cost,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
    if (task.result_video_id) body.resultVideoId = String(task.result_video_id);
    if (task.error)
      body.error = { code: task.error.code, message: task.error.message };
    return body;
  }

  // Only ids, status and progress go to the WebSocket (accepted risk, ADD T-03).
  async function notify(task, extra = {}) {
    const event = {
      event: "video-task-update",
      correlationId: task.correlation_id,
      userId: String(task.runner_id),
      projectId: String(task.project_id),
      taskId: String(task._id),
      status: task.status,
      step: task.step,
      totalSteps: task.total_steps,
      progress: task.progress,
      ...extra,
    };
    try {
      await bus.publishWs(event);
    } catch (err) {
      // A lost notification does not undo the stored state; GET recovers it.
      log.error("video.task.notify_failed", {
        correlationId: task.correlation_id,
        taskId: event.taskId,
        message: err.message,
      });
    }
  }

  async function publishCancel(task) {
    try {
      await bus.publishControl({
        taskId: String(task._id),
        correlationId: task.correlation_id,
      });
    } catch (err) {
      log.error("video.task.cancel_publish_failed", {
        correlationId: task.correlation_id,
        taskId: String(task._id),
        message: err.message,
      });
    }
  }

  function taskMessage(task) {
    return {
      messageId: crypto.randomUUID(),
      correlationId: task.correlation_id,
      timestamp: now().toISOString(),
      operation: OPERATION,
      taskId: String(task._id),
      userId: String(task.runner_id),
      projectId: String(task.project_id),
      totalSteps: task.total_steps,
      plan: task.plan,
    };
  }

  // Publishes the task and records the broker's confirmation. On failure the
  // task stays queued with published_at null and the routine republishes it (D-41).
  async function publish(task) {
    try {
      await bus.publishOperation(taskMessage(task));
      await VideoTask.updateOne(
        { _id: task._id, status: "queued" },
        { $set: { published_at: now() } },
      );
      return true;
    } catch (err) {
      log.error("video.task.publish_failed", {
        correlationId: task.correlation_id,
        taskId: String(task._id),
        message: err.message,
      });
      return false;
    }
  }

  // At-least-once refund (D-45): "pending" is written together with the final
  // status; it becomes "done" only after the users service answered. Failures
  // leave it pending for the redelivery or the routine to retry.
  async function settleRefund(task) {
    const current = await VideoTask.findById(task._id).lean();
    if (!current || current.refund?.state !== "pending") return;
    try {
      await quota.refund(current.runner_id, current.reserved_credits);
    } catch (err) {
      log.error("video.task.refund_failed", {
        correlationId: current.correlation_id,
        taskId: String(current._id),
        userId: String(current.runner_id),
        credits: current.reserved_credits,
        message: err.message,
      });
      return;
    }
    await VideoTask.updateOne(
      { _id: current._id, "refund.state": "pending" },
      { $set: { refund: { state: "done", at: now() } } },
    );
    log.info("video.task.refunded", {
      correlationId: current.correlation_id,
      taskId: String(current._id),
      userId: String(current.runner_id),
      credits: current.reserved_credits,
    });
  }

  // Moves an active task to a final status. Returns the stored task when this
  // call won the transition, null otherwise.
  async function finish(task, status, fields = {}) {
    const set = { status, status_changed_at: now(), ...fields };
    if (status !== "completed" && task.reserved_credits > 0)
      set.refund = { state: "pending", at: null };

    const result = await VideoTask.updateOne(
      { _id: task._id, status: { $in: ACTIVE } },
      { $set: set },
    );
    if (result.modifiedCount !== 1) return null;
    return VideoTask.findById(task._id).lean();
  }

  // Failure (worker error, dead-letter, routine): refund, slot, notification.
  async function fail(task, code, reason, cause) {
    const stored = await finish(task, "failed", {
      error: { code, message: MESSAGES[code] || code },
    });
    log.warn("video.task.failed", {
      correlationId: task.correlation_id,
      taskId: String(task._id),
      userId: String(task.runner_id),
      code,
      reason,
      cause,
    });
    const current = stored || (await VideoTask.findById(task._id).lean());
    if (!current || current.status !== "failed") return;
    await settleRefund(current);
    await locks.release(current.project_id, current._id);
    if (stored) await notify(stored, { error: { code } });
  }

  async function removeTargets(task, keys) {
    const owner = task.plan?.targets?.original?.userId || task.owner_id;
    for (const key of keys) {
      await storage.remove(storage.parseKey(owner, key));
    }
  }

  function targetKeys(plan) {
    return Object.values(plan?.targets || {}).map(
      (t) => `${t.projectId}/${t.stage}/${t.name}`,
    );
  }

  // ---- acceptance (ADD T-03, steps 3 to 7; shared with validate) ----------

  async function prepare({ callerId, inputVideos, steps }) {
    // 3. profile of the runner (X-Caller-Id), not of the project owner.
    const profile = await users.getUserType(callerId);
    const limits = profiles.limitsFor(profile);
    if (!limits) throw new VideoError(403, "FORBIDDEN");

    // 4. input videos ready.
    for (const video of inputVideos) {
      if (video.status !== "completed")
        throw new VideoError(409, "RESOURCE_NOT_READY", {
          videoId: String(video._id),
        });
    }

    // 5. format and profile limits on videos.meta (ADD T-05).
    for (const video of inputVideos) {
      const meta = video.meta || {};
      if (!formats.CONTAINERS[meta.container])
        throw new VideoError(422, "UNSUPPORTED_FORMAT", {
          videoId: String(video._id),
        });
      const codecError = formats.validateStreams(
        meta.container,
        meta.video_codec,
        meta.audio_codec ?? null,
      );
      if (codecError)
        throw new VideoError(422, codecError.code, codecError.details);
      const limitError =
        profiles.checkSize(meta.size_bytes, limits) ||
        profiles.checkDuration(meta.duration_ms, limits);
      if (limitError)
        throw new VideoError(422, limitError.code, limitError.details);
    }

    // 6. steps (D-42).
    if (!chain.isStepList(steps))
      throw new VideoError(422, "INVALID_REQUEST", { field: "steps" });
    const inputProps = chain.propsFromMeta(inputVideos[0].meta);
    const checked = chain.validateChain(steps, inputProps, profile, registry);

    if (checked.error) return { profile, stepError: checked.error };

    // 7. plan decisions (the targets need the task id, added on submit).
    const decided = plans.decide(steps, inputVideos, checked.props, registry);
    return {
      profile,
      stepError: null,
      decided,
      cost: chain.chainCost(steps, registry),
      totalSteps: steps.length,
    };
  }

  // POST …/videos/validate (ADD T-01, D-43): no task, no quota, no queues.
  async function validate({ callerId, inputVideos, steps }) {
    const prepared = await prepare({ callerId, inputVideos, steps });
    if (prepared.stepError) {
      return {
        valid: false,
        cost: null,
        totalSteps: steps.length,
        output: null,
        errors: [prepared.stepError],
      };
    }
    return {
      valid: true,
      cost: prepared.cost,
      totalSteps: prepared.totalSteps,
      output: prepared.decided.output,
      errors: [],
    };
  }

  // POST …/videos/:video/operations (ADD T-03, steps 3 to 11).
  async function submit({
    project,
    callerId,
    inputVideos,
    steps,
    correlationId,
  }) {
    const prepared = await prepare({ callerId, inputVideos, steps });
    if (prepared.stepError)
      throw new VideoError(422, "INVALID_STEP_PARAMS", prepared.stepError);

    const { profile, decided, cost, totalSteps } = prepared;
    const taskId = new mongoose.Types.ObjectId();
    const projectId = project._id;

    // 8. active-task slot (NFR-021; image processing does not count, D-38).
    if (!(await locks.acquire(projectId, taskId))) {
      const holder = await locks.holderOf(projectId);
      throw new VideoError(409, "TASK_ALREADY_ACTIVE", {
        taskId: holder ? String(holder) : null,
      });
    }

    // 9. reservation, except Premium (ADD T-04, QUOTA-005, V8).
    const reserved = profile === "premium" ? 0 : cost;
    if (reserved > 0) {
      let ok;
      try {
        ok = await quota.reserve(callerId, reserved);
      } catch (err) {
        await locks.release(projectId, taskId);
        // D-48: the reservation may have been stored with the answer lost.
        log.error("video.task.reserve_failed", {
          correlationId,
          userId: String(callerId),
          credits: reserved,
          message: err.message,
        });
        throw new VideoError(500, "INTERNAL_ERROR");
      }
      if (!ok) {
        await locks.release(projectId, taskId);
        const remaining = await quota.remaining(callerId).catch(() => null);
        throw new VideoError(429, "QUOTA_EXCEEDED", { cost, remaining });
      }
    }

    // 10. task in queued, then publication.
    const plan = plans.buildPlan({
      taskId,
      ownerId: project.user_id,
      projectId,
      steps,
      inputs: inputVideos,
      decided,
    });
    const at = now();
    let task;
    try {
      task = await VideoTask.create({
        _id: taskId,
        project_id: projectId,
        owner_id: project.user_id,
        runner_id: callerId,
        kind: chain.taskKind(steps),
        steps: plan.steps,
        input_video_ids: inputVideos.map((v) => v._id),
        status: "queued",
        step: 1,
        total_steps: totalSteps,
        progress: 0,
        cost,
        reserved_credits: reserved,
        refund: { state: "none", at: null },
        correlation_id: correlationId,
        plan,
        published_at: null,
        status_changed_at: at,
      });
    } catch (err) {
      // No task to record a pending refund on: give the credits back now.
      if (reserved > 0)
        await quota.refund(callerId, reserved).catch((refundErr) =>
          log.error("video.task.refund_failed", {
            correlationId,
            userId: String(callerId),
            credits: reserved,
            message: refundErr.message,
          }),
        );
      await locks.release(projectId, taskId);
      throw err;
    }
    task = task.toObject ? task.toObject() : task;

    log.info("video.task.accepted", {
      correlationId,
      taskId: String(taskId),
      userId: String(callerId),
      projectId: String(projectId),
      kind: task.kind,
      cost,
      reserved,
    });

    await publish(task);
    await notify(task);

    // 11.
    return { taskId: String(taskId), status: "queued" };
  }

  // ---- query and cancellation ---------------------------------------------

  async function findInProject(projectId, taskId) {
    if (!mongoose.isValidObjectId(taskId))
      throw new VideoError(404, "NOT_FOUND");
    const task = await VideoTask.findOne({
      _id: taskId,
      project_id: projectId,
    }).lean();
    if (!task) throw new VideoError(404, "NOT_FOUND");
    return task;
  }

  async function get({ projectId, taskId }) {
    return view(await findInProject(projectId, taskId));
  }

  // DELETE …/videos/tasks/:taskId (TASK-004/005, ADD T-03).
  async function cancel({ projectId, taskId, callerId, correlationId }) {
    const task = await findInProject(projectId, taskId);
    if (String(task.runner_id) !== String(callerId))
      throw new VideoError(403, "FORBIDDEN");

    const stored = await finish(task, "cancelled");
    if (!stored) throw new VideoError(409, "TASK_NOT_ACTIVE");

    log.info("video.task.cancelled", {
      correlationId,
      taskCorrelationId: task.correlation_id,
      taskId: String(task._id),
      userId: String(callerId),
    });
    await publishCancel(stored);
    await settleRefund(stored);
    await locks.release(stored.project_id, stored._id);
    await notify(stored);
    return view(await VideoTask.findById(stored._id).lean());
  }

  // ---- worker replies -------------------------------------------------------

  async function onStarted(task, reply) {
    if (task.status === "cancelled") {
      // The worker may have lost the cancellation (restart): send it again (ADR-003).
      log.warn("video.task.started_after_cancel", {
        correlationId: task.correlation_id,
        taskId: String(task._id),
      });
      return publishCancel(task);
    }
    const result = await VideoTask.updateOne(
      { _id: task._id, status: { $in: ACTIVE } },
      {
        $set: {
          status: "processing",
          step: 1,
          progress: 0,
          status_changed_at: now(),
        },
      },
    );
    if (result.modifiedCount !== 1) return;
    log.info("video.task.started", {
      correlationId: task.correlation_id,
      taskId: String(task._id),
      redelivered: Boolean(reply.metadata?.redelivered),
    });
    await notify(await VideoTask.findById(task._id).lean());
  }

  function resultVideo(task, output, firstSource) {
    const probed = output.meta;
    const container = formats.containerFromProbe(
      probed.formatName,
      probed.majorBrand,
    );
    const { displayWidth, displayHeight } = display.displayDimensions(
      probed.width,
      probed.height,
      probed.rotation,
    );
    const storageKeys = {
      original_key: output.keys.original,
      thumb_key: output.keys.thumb,
      first_frame_key: output.keys.firstFrame,
    };
    if (output.keys.preview) storageKeys.preview_key = output.keys.preview;

    return {
      _id: task._id, // ADR-005
      project_id: task.project_id,
      owner_id: task.owner_id,
      created_by: task.runner_id,
      original_name:
        firstSource?.original_name ||
        `video${formats.CONTAINERS[container].extension}`,
      mime_type: formats.CONTAINERS[container].mimeType,
      status: "completed",
      storage: storageKeys,
      meta: {
        container,
        video_codec: probed.videoCodec,
        audio_codec: probed.audioCodec ?? null,
        width: probed.width,
        height: probed.height,
        rotation: probed.rotation,
        display_width: displayWidth,
        display_height: displayHeight,
        fps_num: probed.fpsNum,
        fps_den: probed.fpsDen,
        duration_ms: probed.durationMs,
        size_bytes: probed.sizeBytes,
        bitrate: probed.bitrate,
      },
      source_video_ids: task.input_video_ids,
      recipe: task.steps,
      task_id: task._id,
    };
  }

  function outputProblem(task, output) {
    const keys = output?.keys || {};
    if (!output?.meta || !keys.original || !keys.thumb || !keys.firstFrame)
      return "missing_outputs";
    if (
      !formats.containerFromProbe(
        output.meta.formatName,
        output.meta.majorBrand,
      )
    )
      return "unknown_container";
    if (Boolean(keys.preview) !== Boolean(output.previewMade))
      return "preview_mismatch";
    return null;
  }

  async function onCompleted(task, reply) {
    const output = reply.output || {};
    const written = Object.values(output.keys || {}).filter(Boolean);

    if (!ACTIVE.includes(task.status) && task.status !== "completed") {
      // Late result of a cancelled or failed task: delete what was uploaded (ADD T-03).
      log.warn("video.task.late_result_discarded", {
        correlationId: task.correlation_id,
        taskId: String(task._id),
        status: task.status,
      });
      return removeTargets(task, [
        ...new Set([...written, ...targetKeys(task.plan)]),
      ]);
    }

    if (task.status !== "completed") {
      const problem = outputProblem(task, output);
      if (problem) {
        await removeTargets(task, written);
        return fail(task, "PROCESSING_ERROR", problem);
      }
    }

    const stored = await finish(task, "completed", {
      progress: 100,
      step: task.total_steps,
      result_video_id: task._id,
    });
    const current = stored || (await VideoTask.findById(task._id).lean());
    if (current.status !== "completed") {
      // Lost the race to a cancellation: the result is late.
      return removeTargets(task, [
        ...new Set([...written, ...targetKeys(task.plan)]),
      ]);
    }

    let created = false;
    try {
      const firstSource = await Video.findById(
        current.input_video_ids[0],
      ).lean();
      await Video.create(resultVideo(current, output, firstSource));
      created = true;
    } catch (err) {
      // Created by a previous delivery of this reply (ADR-005).
      if (err.code !== DUPLICATE_KEY) throw err;
    }
    await locks.release(current.project_id, current._id);

    if (stored || created) {
      log.info("video.task.completed", {
        correlationId: current.correlation_id,
        taskId: String(current._id),
        userId: String(current.runner_id),
        resultVideoId: String(current._id),
      });
      await notify(current, { resultVideoId: String(current._id) });
    }
  }

  // Replies of the worker for task.run, including dead-letters (ADD T-03).
  async function handleReply(reply, headers = {}) {
    if (!reply || !mongoose.isValidObjectId(reply.taskId)) {
      log.warn("video.task.unknown_reply", {
        correlationId: reply?.correlationId,
      });
      return;
    }
    const task = await VideoTask.findById(reply.taskId).lean();
    if (!task) return;

    // Request dead-lettered after two deliveries (NFR-007): it has x-death and,
    // being a request, no status.
    if (headers["x-death"] || !("status" in reply)) {
      await fail(task, "PROCESSING_ERROR", "delivery_limit");
      return publishCancel(task);
    }

    switch (reply.status) {
      case "started":
        return onStarted(task, reply);
      case "completed":
        return onCompleted(task, reply);
      case "failed": {
        const code =
          reply.error?.code === "RESOURCE_UNAVAILABLE"
            ? "RESOURCE_UNAVAILABLE"
            : "PROCESSING_ERROR";
        if (ACTIVE.includes(task.status) || task.status === "failed")
          return fail(task, code, "worker", reply.error?.message);
        return undefined;
      }
      case "cancelled":
        log.info("video.task.worker_cancelled", {
          correlationId: task.correlation_id,
          taskId: String(task._id),
        });
        return undefined;
      default:
        log.warn("video.task.unknown_status", {
          correlationId: task.correlation_id,
          taskId: String(task._id),
          status: reply.status,
        });
        return undefined;
    }
  }

  // ---- used by the maintenance routine (D-41, D-46) -----------------------

  async function closeStuck(task) {
    await fail(task, "PROCESSING_ERROR", "stuck");
    await publishCancel(task);
  }

  async function cancelForDeletedProject(task) {
    const stored = await finish(task, "cancelled");
    if (!stored) return;
    log.info("video.task.cancelled_project_deleted", {
      correlationId: task.correlation_id,
      taskId: String(task._id),
    });
    await publishCancel(stored);
    await settleRefund(stored);
    await locks.release(stored.project_id, stored._id);
  }

  return {
    OPERATION,
    validate,
    submit,
    get,
    cancel,
    handleReply,
    publish,
    settleRefund,
    closeStuck,
    cancelForDeletedProject,
  };
}

module.exports = { createTasks, OPERATION, ACTIVE };
