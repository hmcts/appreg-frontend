const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { createSsoLoginLock } = require('./SsoLoginLock');

test('serializes owners and releases the lock for the next worker', async (t) => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'sso-lock-'));
  const lockPath = path.join(tempDirectory, 'login.lock');
  t.after(() => fs.rmSync(tempDirectory, { recursive: true, force: true }));

  const firstLock = createSsoLoginLock(lockPath, { pollMilliseconds: 5 });
  const secondLock = createSsoLoginLock(lockPath, { pollMilliseconds: 5 });
  const firstOwner = await firstLock.acquire();
  let secondAcquired = false;
  const secondOwnerPromise = secondLock.acquire().then((owner) => {
    secondAcquired = true;
    return owner;
  });

  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(secondAcquired, false);
  assert.equal(firstLock.release('another-owner'), false);
  assert.equal(await firstLock.acquire(), firstOwner);
  assert.equal(firstLock.release(), true);

  await secondOwnerPromise;
  assert.equal(secondAcquired, true);
  assert.equal(secondLock.release(), true);
});

test('recovers an old lock whose owner process is no longer running', async (t) => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'sso-lock-'));
  const lockPath = path.join(tempDirectory, 'login.lock');
  t.after(() => fs.rmSync(tempDirectory, { recursive: true, force: true }));

  fs.mkdirSync(lockPath);
  fs.writeFileSync(
    path.join(lockPath, 'owner.json'),
    JSON.stringify({ id: 'abandoned', pid: 2147483647 }),
  );
  const oldTime = new Date(Date.now() - 1000);
  fs.utimesSync(lockPath, oldTime, oldTime);

  const lock = createSsoLoginLock(lockPath, {
    pollMilliseconds: 5,
    staleMilliseconds: 10,
  });
  const owner = await lock.acquire();

  assert.notEqual(owner, 'abandoned');
  assert.equal(lock.release(owner), true);
});
