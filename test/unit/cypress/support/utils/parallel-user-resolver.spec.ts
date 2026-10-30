import { resolveParallelUserKey } from '../../../../../cypress/support/utils/ParallelUserResolver';

const configuredUsers = {
  user1: {},
  user2: {},
  user3: {},
  admin1: {},
  admin2: {},
  admin3: {},
};

describe('resolveParallelUserKey', () => {
  it('keeps the dedicated empty-reports account on its requested identity', () => {
    expect(resolveParallelUserKey('admin3', configuredUsers, 1)).toBe('admin3');
  });

  it('assigns other accounts to the configured parallel worker identity', () => {
    expect(resolveParallelUserKey('user1', configuredUsers, 2)).toBe('user2');
  });
});
