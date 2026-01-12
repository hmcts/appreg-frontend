import type { FormGroup } from '@angular/forms';

import { loadQuery } from '@components/applications-list/util/load-query';
import { ApplicationListStatus } from '@openapi';
import { toStatus } from '@util/application-status-helpers';
import { toTimeString } from '@util/time-helpers';

jest.mock('@openapi', () => ({}));
jest.mock('@components/duration-input/duration-input.component', () => ({}));

jest.mock('@util/application-status-helpers', () => ({
  toStatus: jest.fn(),
}));

jest.mock('@util/time-helpers', () => ({
  toTimeString: jest.fn(),
}));

const mockedToStatus = toStatus as jest.MockedFunction<typeof toStatus>;
const mockedToTimeString = toTimeString as jest.MockedFunction<
  typeof toTimeString
>;

function makeForm(raw: unknown): FormGroup {
  return {
    getRawValue: () => raw,
  } as unknown as FormGroup;
}

describe('loadQuery', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty query when all inputs are empty/null/undefined', () => {
    mockedToTimeString.mockReturnValue(undefined);
    mockedToStatus.mockReturnValue(undefined);

    const form = makeForm({
      date: '   ',
      time: null,
      description: '',
      status: null,
      court: undefined,
      location: '   ',
      cja: '',
    });

    const result = loadQuery(form);

    expect(result).toEqual({});
    expect(mockedToTimeString).toHaveBeenCalledWith(null);
    expect(mockedToStatus).toHaveBeenCalledWith(null);
  });

  it('trims string fields and includes mapped time/status when present', () => {
    mockedToTimeString.mockReturnValue('10:30');
    mockedToStatus.mockReturnValue('OPEN' as ApplicationListStatus);

    const rawTime = { hours: 10, minutes: 30 };

    const form = makeForm({
      date: ' 2025-12-15 ',
      time: rawTime,
      description: '  Morning session  ',
      status: 'open',
      court: ' LOC123 ',
      location: '  Town Hall  ',
      cja: ' 52 ',
    });

    const result = loadQuery(form);

    expect(result).toEqual({
      date: '2025-12-15',
      time: '10:30',
      description: 'Morning session',
      status: 'OPEN',
      courtLocationCode: 'LOC123',
      otherLocationDescription: 'Town Hall',
      cjaCode: '52',
    });

    expect(mockedToTimeString).toHaveBeenCalledWith(rawTime);
    expect(mockedToStatus).toHaveBeenCalledWith('open');
  });

  it('does not set time/status when helpers return empty string', () => {
    mockedToTimeString.mockReturnValue('');
    mockedToStatus.mockReturnValue(undefined);

    const form = makeForm({
      date: '   ',
      time: { hours: 9, minutes: 0 },
      description: '   ',
      status: 'OPEN',
      court: '   ',
      location: '',
      cja: null,
    });

    const result = loadQuery(form);

    // Empty string is excluded
    expect(result).toEqual({});
    expect(mockedToTimeString).toHaveBeenCalled();
    expect(mockedToStatus).toHaveBeenCalled();
  });

  it('includes only populated fields (partial query)', () => {
    mockedToTimeString.mockReturnValue(undefined);
    mockedToStatus.mockReturnValue('CLOSED' as ApplicationListStatus);

    const form = makeForm({
      date: '2025-01-02',
      time: null,
      description: null,
      status: 'closed',
      court: '',
      location: null,
      cja: undefined,
    });

    const result = loadQuery(form);

    expect(result).toEqual({
      date: '2025-01-02',
      status: 'CLOSED',
    });
  });
});
