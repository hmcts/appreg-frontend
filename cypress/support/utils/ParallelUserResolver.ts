const PARALLEL_USER_KEYS = ['user1', 'user2', 'user3', 'admin1', 'admin2'];

/** Selects a dedicated configured account for each Cypress-parallel worker. */
export function resolveParallelUserKey(
  requestedUserKey: string,
  configuredUsers: Record<string, unknown>,
  workerValue: unknown = Cypress.env('CYPRESS_THREAD'),
): string {
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
