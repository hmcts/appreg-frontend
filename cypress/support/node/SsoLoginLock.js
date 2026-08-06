const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const OWNER_FILE = 'owner.json';

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function readOwner(lockPath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(lockPath, OWNER_FILE), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

function reclaimAbandonedLock(lockPath, staleMilliseconds) {
  let stats;
  try {
    stats = fs.statSync(lockPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return;
    }
    throw error;
  }

  if (Date.now() - stats.mtimeMs < staleMilliseconds) {
    return;
  }

  const owner = readOwner(lockPath);
  if (owner && owner.pid && isProcessRunning(owner.pid)) {
    return;
  }

  const abandonedPath = `${lockPath}.abandoned-${crypto.randomUUID()}`;
  try {
    fs.renameSync(lockPath, abandonedPath);
    fs.rmSync(abandonedPath, { recursive: true, force: true });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

function createSsoLoginLock(
  lockPath,
  {
    timeoutMilliseconds = 240000,
    staleMilliseconds = 180000,
    pollMilliseconds = 250,
  } = {},
) {
  let currentOwnerId = null;

  return {
    async acquire() {
      const existingOwner = readOwner(lockPath);
      if (
        currentOwnerId &&
        existingOwner &&
        existingOwner.id === currentOwnerId
      ) {
        return currentOwnerId;
      }

      fs.mkdirSync(path.dirname(lockPath), { recursive: true });
      const owner = {
        id: crypto.randomUUID(),
        pid: process.pid,
        acquiredAt: new Date().toISOString(),
      };
      const deadline = Date.now() + timeoutMilliseconds;

      while (Date.now() < deadline) {
        try {
          fs.mkdirSync(lockPath);
          fs.writeFileSync(
            path.join(lockPath, OWNER_FILE),
            JSON.stringify(owner),
          );
          currentOwnerId = owner.id;
          return owner.id;
        } catch (error) {
          if (error.code !== 'EEXIST') {
            throw error;
          }
        }

        reclaimAbandonedLock(lockPath, staleMilliseconds);
        await delay(pollMilliseconds);
      }

      throw new Error(
        `Timed out after ${timeoutMilliseconds}ms waiting for the SSO login lock`,
      );
    },

    release(ownerId = currentOwnerId) {
      const owner = readOwner(lockPath);
      if (!owner || owner.id !== ownerId) {
        return false;
      }

      fs.rmSync(lockPath, { recursive: true, force: true });
      currentOwnerId = null;
      return true;
    },
  };
}

module.exports = { createSsoLoginLock };
