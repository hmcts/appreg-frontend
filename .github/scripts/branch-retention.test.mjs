import { expect, test } from '@jest/globals';

// mirror of policy for unit tests (pure function)
function filterBranches(items, cfg) {
  const rx = (p) => new RegExp('^' + p.replace('*', '.*') + '$');
  const isProtected = (b) =>
    (cfg.protectedPatterns || []).some((p) => rx(p).test(b));
  const isDNDByName = (b) =>
    (cfg.doNotDelete.namePatterns || []).some((p) => rx(p).test(b));

  return items.filter((it) => {
    if (it.inactiveDays < cfg.inactivityDays) {
      return false;
    }
    if (isProtected(it.branch)) {
      return false;
    }
    if (isDNDByName(it.branch)) {
      return false;
    }
    if (it.openPR) {
      return false;
    }
    if (it.doNotDeleteByLabel) {
      return false;
    }
    return true;
  });
}

test('inactive >=60 only', () => {
  const cfg = {
    inactivityDays: 60,
    protectedPatterns: ['master', 'develop', 'release/*'],
    doNotDelete: { namePatterns: [] },
  };
  const data = [
    {
      branch: 'feat/a',
      inactiveDays: 61,
      openPR: false,
      doNotDeleteByLabel: false,
    },
    {
      branch: 'feat/b',
      inactiveDays: 59,
      openPR: false,
      doNotDeleteByLabel: false,
    },
  ];
  expect(filterBranches(data, cfg).map((b) => b.branch)).toEqual(['feat/a']);
});

test('exclude protected and do-not-delete', () => {
  const cfg = {
    inactivityDays: 60,
    protectedPatterns: ['master', 'release/*'],
    doNotDelete: { namePatterns: ['do-not-delete/*'] },
  };
  const data = [
    {
      branch: 'master',
      inactiveDays: 400,
      openPR: false,
      doNotDeleteByLabel: false,
    },
    {
      branch: 'release/1.2',
      inactiveDays: 400,
      openPR: false,
      doNotDeleteByLabel: false,
    },
    {
      branch: 'do-not-delete/keepme',
      inactiveDays: 400,
      openPR: false,
      doNotDeleteByLabel: false,
    },
    {
      branch: 'feat/old',
      inactiveDays: 400,
      openPR: false,
      doNotDeleteByLabel: false,
    },
  ];
  expect(filterBranches(data, cfg).map((b) => b.branch)).toEqual(['feat/old']);
});

test('exclude open PRs and PR label', () => {
  const cfg = {
    inactivityDays: 60,
    protectedPatterns: [],
    doNotDelete: { namePatterns: [] },
  };
  const data = [
    {
      branch: 'feat/old',
      inactiveDays: 90,
      openPR: true,
      doNotDeleteByLabel: false,
    },
    {
      branch: 'feat/older',
      inactiveDays: 120,
      openPR: false,
      doNotDeleteByLabel: true,
    },
    {
      branch: 'feat/eligible',
      inactiveDays: 120,
      openPR: false,
      doNotDeleteByLabel: false,
    },
  ];
  expect(filterBranches(data, cfg).map((b) => b.branch)).toEqual([
    'feat/eligible',
  ]);
});
