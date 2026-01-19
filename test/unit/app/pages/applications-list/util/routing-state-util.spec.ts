import { Location } from '@angular/common';
import type { FormGroup } from '@angular/forms';

import {
  EntryDetailNavState,
  hasAnyParams,
  readNavState,
  toRow,
} from '@components/applications-list/util/routing-state-util';
import { ApplicationListStatus } from '@openapi';

function makeForm(raw: unknown): FormGroup {
  return {
    getRawValue: () => raw,
  } as unknown as FormGroup;
}

describe('readNavState', () => {
  const makeLocation = (state: unknown): Location =>
    ({
      getState: () => state,
    }) as unknown as Location;

  it('returns null when not running in browser platform', () => {
    const loc = makeLocation({ appListId: 'AL-1' });
    const res = readNavState(loc, 'server' as unknown as object);

    expect(res).toBeNull();
  });

  it('returns null when state is not an object', () => {
    const loc = makeLocation('not-an-object');
    const res = readNavState(loc, 'browser' as unknown as object);

    expect(res).toBeNull();
  });

  it('returns state when it contains only a valid appListId', () => {
    const state: EntryDetailNavState = { appListId: 'AL-1' };
    const loc = makeLocation(state);

    const res = readNavState(loc, 'browser' as unknown as object);

    expect(res).toEqual(state);
  });

  it('returns null when appListId exists but is not a string or null', () => {
    const loc = makeLocation({ appListId: 123 });
    const res = readNavState(loc, 'browser' as unknown as object);

    expect(res).toBeNull();
  });

  it('accepts appListId: null', () => {
    const state = { appListId: null };
    const loc = makeLocation(state);

    const res = readNavState(loc, 'browser' as unknown as object);

    expect(res).toEqual(state);
  });

  it('returns null when row exists but is not an object', () => {
    const loc = makeLocation({ row: 'nope' });
    const res = readNavState(loc, 'browser' as unknown as object);

    expect(res).toBeNull();
  });

  it('returns null when row.id is missing or not a string', () => {
    const loc1 = makeLocation({ row: {} });
    const res1 = readNavState(loc1, 'browser' as unknown as object);
    expect(res1).toBeNull();

    const loc2 = makeLocation({ row: { id: 12 } });
    const res2 = readNavState(loc2, 'browser' as unknown as object);
    expect(res2).toBeNull();
  });

  it('returns state when row has string id and no resultApplicantContext', () => {
    const state = { row: { id: 'EN-1' } };
    const loc = makeLocation(state);

    const res = readNavState(loc, 'browser' as unknown as object);

    expect(res).toEqual(state);
  });

  it('returns state when row.resultApplicantContext is valid', () => {
    const state = {
      appListId: 'AL-1',
      row: {
        id: 'EN-1',
        resultApplicantContext: {
          applicant: 'A',
          respondent: 'R',
          title: 'T',
        },
      },
    };

    const loc = makeLocation(state);
    const res = readNavState(loc, 'browser' as unknown as object);

    expect(res).toEqual(state);
  });

  it('returns null when row.resultApplicantContext exists but is not an object', () => {
    const state = {
      row: { id: 'EN-1', resultApplicantContext: 'bad' },
    };

    const loc = makeLocation(state);
    const res = readNavState(loc, 'browser' as unknown as object);

    expect(res).toBeNull();
  });

  it('returns null when row.resultApplicantContext has wrong field types', () => {
    const badApplicant = {
      row: {
        id: 'EN-1',
        resultApplicantContext: {
          applicant: 1,
          respondent: 'R',
          title: 'T',
        },
      },
    };

    const badRespondent = {
      row: {
        id: 'EN-1',
        resultApplicantContext: {
          applicant: 'A',
          respondent: 2,
          title: 'T',
        },
      },
    };

    const badTitle = {
      row: {
        id: 'EN-1',
        resultApplicantContext: {
          applicant: 'A',
          respondent: 'R',
          title: 3,
        },
      },
    };

    expect(
      readNavState(makeLocation(badApplicant), 'browser' as unknown as object),
    ).toBeNull();
    expect(
      readNavState(makeLocation(badRespondent), 'browser' as unknown as object),
    ).toBeNull();
    expect(
      readNavState(makeLocation(badTitle), 'browser' as unknown as object),
    ).toBeNull();
  });

  it('accepts row.resultApplicantContext: null', () => {
    const state = {
      row: { id: 'EN-1', resultApplicantContext: null },
    };

    const res = readNavState(
      makeLocation(state),
      'browser' as unknown as object,
    );

    expect(res).toEqual(state);
  });
});

describe('hasAnyParams', () => {
  it('returns false when all fields are empty/default', () => {
    const form = makeForm({
      date: null,
      time: null,
      description: '',
      status: null,
      court: '',
      location: '',
      cja: '',
    });

    expect(hasAnyParams(form)).toBe(false);
  });

  it('returns true when any field has a value', () => {
    const form = makeForm({
      date: '2025-12-15',
      time: null,
      description: '',
      status: null,
      court: '',
      location: '',
      cja: '',
    });

    expect(hasAnyParams(form)).toBe(true);
  });
});

describe('toRow', () => {
  it('maps summary dto fields and normalises time', () => {
    const dto = {
      id: 'AL-1',
      date: '2025-12-15',
      time: '10:30:00',
      location: 'Court 1',
      description: 'Morning session',
      entriesCount: 3,
      status: ApplicationListStatus.OPEN,
    };

    expect(toRow(dto)).toEqual({
      id: 'AL-1',
      date: '2025-12-15',
      time: '10:30',
      location: 'Court 1',
      description: 'Morning session',
      entries: 3,
      status: ApplicationListStatus.OPEN,
      deletable: true,
      etag: null,
      rowVersion: null,
    });
  });
});
