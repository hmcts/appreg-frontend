import {
  type SortState,
  ariaSortFor,
  getNextSortState,
  suppressSortEvent,
} from '@util/table-sort';

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
    expect(ariaSortFor({ key: 'courtName', direction: 'asc' }, 'courtName')).toBe(
      'ascending',
    );
  });

  it('maps descending state to the aria descending value', () => {
    expect(
      ariaSortFor({ key: 'courtName', direction: 'desc' }, 'courtName'),
    ).toBe('descending');
  });
});
