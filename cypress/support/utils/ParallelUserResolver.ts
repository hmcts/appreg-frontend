const PARALLEL_USER_KEYS = ['user1', 'user2', 'user3', 'admin1', 'admin2'];
const DEDICATED_USER_KEYS = ['admin3'];

/** Selects a dedicated configured account for each Cypress-parallel worker. */
export function resolveParallelUserKey(
  requestedUserKey: string,
  configuredUsers: Record<string, unknown>,
  workerValue: unknown = Cypress.env('CYPRESS_THREAD'),
): string {
  if (DEDICATED_USER_KEYS.includes(requestedUserKey)) {
    return requestedUserKey;
  }

  const workerNumber = Number(workerValue);

  if (
    !Number.isInteger(workerNumber) ||
    workerNumber < 1 ||
    workerNumber > PARALLEL_USER_KEYS.length
  ) {
    return requestedUserKey;
  }

  const workerUserKey = PARALLEL_USER_KEYS[workerNumber - 1];
  return configuredUsers[workerUserKey] ? workerUserKey : requestedUserKey;
}
