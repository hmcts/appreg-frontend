import {
  type SortState,
  ariaSortFor,
  getNextSortState,
  sortRows,
  suppressSortEvent,
} from '@util/table-sort';

describe('sortRows', () => {
  it('sorts string values numerically in ascending order', () => {
    const rows = [{ value: '10' }, { value: '2' }, { value: '1' }];

    expect(sortRows(rows, { key: 'value', direction: 'asc' })).toEqual([
      { value: '1' },
      { value: '2' },
      { value: '10' },
    ]);
  });

  it('sorts numeric values in descending order and does not mutate the input', () => {
    const rows = [{ value: 2 }, { value: 10 }, { value: 1 }];

    expect(sortRows(rows, { key: 'value', direction: 'desc' })).toEqual([
      { value: 10 },
      { value: 2 },
      { value: 1 },
    ]);
    expect(rows).toEqual([{ value: 2 }, { value: 10 }, { value: 1 }]);
  });

  it('places null and undefined values after populated values', () => {
    const rows = [{ value: null }, { value: 'Beta' }, {}, { value: 'Alpha' }];

    expect(sortRows(rows, { key: 'value', direction: 'asc' })).toEqual([
      { value: 'Alpha' },
      { value: 'Beta' },
      { value: null },
      {},
    ]);
  });
});

describe('getNextSortState', () => {
  it('starts a new sort key in ascending order', () => {
    const current: SortState = { key: 'createdDate', direction: 'desc' };

    expect(getNextSortState(current, 'courtName')).toEqual({
      key: 'courtName',
      direction: 'asc',
    });
  });

  it('toggles the current sort key from ascending to descending', () => {
    const current: SortState = { key: 'courtName', direction: 'asc' };

    expect(getNextSortState(current, 'courtName')).toEqual({
      key: 'courtName',
      direction: 'desc',
    });
  });

  it('toggles the current sort key from descending to ascending', () => {
    const current: SortState = { key: 'courtName', direction: 'desc' };

    expect(getNextSortState(current, 'courtName')).toEqual({
      key: 'courtName',
      direction: 'asc',
    });
  });
});

describe('suppressSortEvent', () => {
  it('returns safely when no event is provided', () => {
    expect(() => suppressSortEvent(null)).not.toThrow();
  });

  it('prevents default behaviour and stops propagation for the event', () => {
    const preventDefault = jest.fn();
    const stopPropagation = jest.fn();
    const stopImmediatePropagation = jest.fn();
    const event = {
      preventDefault,
      stopPropagation,
      stopImmediatePropagation,
    } as unknown as Event;

    suppressSortEvent(event);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(stopImmediatePropagation).toHaveBeenCalledTimes(1);
  });
});

describe('ariaSortFor', () => {
  it('returns none for a non-current sort key by default', () => {
    expect(
      ariaSortFor({ key: 'courtName', direction: 'asc' }, 'createdDate'),
    ).toBe('none');
  });

  it('returns the supplied fallback for a non-current sort key', () => {
    expect(
      ariaSortFor(
        { key: 'courtName', direction: 'asc' },
        'createdDate',
        'descending',
      ),
    ).toBe('descending');
  });

  it('returns the supplied fallback when the current key has no direction', () => {
    const current = {
      key: 'courtName',
      direction: undefined as unknown as SortState['direction'],
    };

    expect(ariaSortFor(current, 'courtName', 'ascending')).toBe('ascending');
  });

  it('maps ascending state to the aria ascending value', () => {
    expect(
      ariaSortFor({ key: 'courtName', direction: 'asc' }, 'courtName'),
    ).toBe('ascending');
  });

  it('maps descending state to the aria descending value', () => {
    expect(
      ariaSortFor({ key: 'courtName', direction: 'desc' }, 'courtName'),
    ).toBe('descending');
  });
});
