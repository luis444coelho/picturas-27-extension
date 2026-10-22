// Active-task slot of a project (ADD T-03, NFR-021). Acquiring is an insert
// guarded by the unique index on project_id; releasing deletes the slot only if
// it still belongs to the same holder, so it never frees another task's slot.
const DUPLICATE_KEY = 11000;

function createLocks({ Lock }) {
  async function acquire(projectId, holderId) {
    try {
      await Lock.create({
        project_id: projectId,
        holder_kind: "task",
        holder_id: holderId,
      });
      return true;
    } catch (err) {
      if (err.code === DUPLICATE_KEY) return false;
      throw err;
    }
  }

  async function holderOf(projectId) {
    const lock = await Lock.findOne({ project_id: projectId }).lean();
    return lock ? lock.holder_id : null;
  }

  async function release(projectId, holderId) {
    await Lock.deleteOne({ project_id: projectId, holder_id: holderId });
  }

  return { acquire, holderOf, release };
}

module.exports = { createLocks, DUPLICATE_KEY };
