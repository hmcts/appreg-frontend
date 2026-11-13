/**
 * Tests for attachLocationDisabler and hasCourtCodes.
 *
 * Without an additionalCourts control the disabler behaves as it always has
 * for the pages that use PlaceFieldsBase. With one (Other courts on
 * /applications), a list holding at least one code counts as a court.
 */

import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';

import {
  attachLocationDisabler,
  hasCourtCodes,
} from '@util/location-suggestion-helpers';

const COURT = 'SYN001';
const OTHER_COURT = 'SYN002';
const CJA = 'CJ99';
const LOCATION = 'Synthetic other location';

function makeControls(
  initial: {
    court?: string;
    location?: string;
    cja?: string;
    courtCodes?: string[];
  } = {},
) {
  return {
    court: new FormControl<string>(initial.court ?? ''),
    location: new FormControl<string>(initial.location ?? ''),
    cja: new FormControl<string>(initial.cja ?? ''),
    courtCodes: new FormControl<string[]>(initial.courtCodes ?? [], {
      nonNullable: true,
    }),
  };
}

type Controls = ReturnType<typeof makeControls>;

const enabledState = (controls: Controls) => ({
  court: controls.court.enabled,
  location: controls.location.enabled,
  cja: controls.cja.enabled,
  courtCodes: controls.courtCodes.enabled,
});

const ALL_ENABLED = {
  court: true,
  location: true,
  cja: true,
  courtCodes: true,
};

describe('attachLocationDisabler', () => {
  let subscription: Subscription | undefined;

  afterEach(() => {
    subscription?.unsubscribe();
    subscription = undefined;
  });

  describe('without additional courts (other pages)', () => {
    const attach = (controls: Controls) => {
      subscription = attachLocationDisabler({
        court: controls.court,
        location: controls.location,
        cja: controls.cja,
      });
    };

    it('enables every control when nothing is filled in', () => {
      const controls = makeControls();

      attach(controls);

      expect(enabledState(controls)).toEqual(ALL_ENABLED);
    });

    it('disables location and CJA when a court is filled in', () => {
      const controls = makeControls();
      attach(controls);

      controls.court.setValue(COURT);

      expect(enabledState(controls)).toEqual({
        ...ALL_ENABLED,
        location: false,
        cja: false,
      });
    });

    it.each([
      ['location', LOCATION],
      ['cja', CJA],
    ] as const)('disables the court when %s is filled in', (name, value) => {
      const controls = makeControls();
      attach(controls);

      controls[name].setValue(value);

      expect(controls.court.disabled).toBe(true);
      expect(controls.location.enabled).toBe(true);
      expect(controls.cja.enabled).toBe(true);
    });

    it('leaves a courts list it was not given alone', () => {
      const controls = makeControls();
      attach(controls);

      controls.courtCodes.setValue([OTHER_COURT]);
      expect(enabledState(controls)).toEqual(ALL_ENABLED);

      controls.cja.setValue(CJA);
      expect(controls.court.disabled).toBe(true);
      expect(controls.courtCodes.enabled).toBe(true);
    });

    it('syncs the values already held when it is attached', () => {
      const controls = makeControls({ court: COURT });

      attach(controls);

      expect(controls.location.disabled).toBe(true);
      expect(controls.cja.disabled).toBe(true);
    });
  });

  describe('with additional courts', () => {
    const attach = (controls: Controls) => {
      subscription = attachLocationDisabler({
        court: controls.court,
        location: controls.location,
        cja: controls.cja,
        additionalCourts: controls.courtCodes,
      });
    };

    it('enables every control when nothing is filled in', () => {
      const controls = makeControls();

      attach(controls);

      expect(enabledState(controls)).toEqual(ALL_ENABLED);
    });

    it('disables location and CJA for other courts alone', () => {
      const controls = makeControls();
      attach(controls);

      controls.courtCodes.setValue([OTHER_COURT]);

      expect(enabledState(controls)).toEqual({
        ...ALL_ENABLED,
        location: false,
        cja: false,
      });
    });

    it('keeps both courts enabled when a court and other courts are filled in', () => {
      const controls = makeControls();
      attach(controls);

      controls.court.setValue(COURT);
      controls.courtCodes.setValue([OTHER_COURT]);

      expect(enabledState(controls)).toEqual({
        ...ALL_ENABLED,
        location: false,
        cja: false,
      });
    });

    it.each([
      ['location', LOCATION],
      ['cja', CJA],
    ] as const)(
      'disables other courts with the court when %s is filled in',
      (name, value) => {
        const controls = makeControls();
        attach(controls);

        controls[name].setValue(value);

        expect(enabledState(controls)).toEqual({
          ...ALL_ENABLED,
          court: false,
          courtCodes: false,
        });
      },
    );

    it.each([
      ['an empty list', []],
      ['a list of blank codes', ['', '   ']],
    ])('counts %s as no court', (_, courtCodes) => {
      const controls = makeControls();
      attach(controls);

      controls.courtCodes.setValue(courtCodes);
      expect(enabledState(controls)).toEqual(ALL_ENABLED);

      controls.cja.setValue(CJA);
      expect(controls.courtCodes.disabled).toBe(true);
      expect(controls.cja.enabled).toBe(true);
    });

    it('enables location and CJA again when the last other court is removed', () => {
      const controls = makeControls();
      attach(controls);
      controls.courtCodes.setValue([OTHER_COURT]);

      controls.courtCodes.setValue([]);

      expect(enabledState(controls)).toEqual(ALL_ENABLED);
    });

    it('syncs other courts already held when it is attached', () => {
      const controls = makeControls({ courtCodes: [OTHER_COURT] });

      attach(controls);

      expect(controls.location.disabled).toBe(true);
      expect(controls.cja.disabled).toBe(true);
    });

    it('stops syncing once unsubscribed', () => {
      const controls = makeControls();
      attach(controls);

      subscription?.unsubscribe();
      controls.courtCodes.setValue([OTHER_COURT]);

      expect(enabledState(controls)).toEqual(ALL_ENABLED);
    });
  });
});

describe('hasCourtCodes', () => {
  it('is true for a list holding a code', () => {
    expect(hasCourtCodes([COURT])).toBe(true);
    expect(hasCourtCodes(['', COURT])).toBe(true);
  });

  it.each([
    ['an empty list', []],
    ['blank codes', ['', '  ']],
    ['items that are not strings', [null, 1]],
    ['a single code that is not in a list', COURT],
    ['null', null],
    ['undefined', undefined],
  ])('is false for %s', (_, value) => {
    expect(hasCourtCodes(value)).toBe(false);
  });
});
