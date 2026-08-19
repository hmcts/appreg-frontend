import { isUiRootPath } from '../../../server/utils/is-ui-root-path';

describe('isUiRootPath', () => {
  it('keeps the root path in the UI for API-style requests', () => {
    expect(isUiRootPath('/')).toBe(true);
  });

  it.each(['/applications-list', '/criminal-justice-areas', '/health'])(
    'does not classify %s as the UI root path',
    (path) => {
      expect(isUiRootPath(path)).toBe(false);
    },
  );
});
