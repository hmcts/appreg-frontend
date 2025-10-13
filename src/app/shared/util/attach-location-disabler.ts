import { AbstractControl } from '@angular/forms';
import { Subscription, merge } from 'rxjs';

export interface LocationControls {
  court: AbstractControl;
  location: AbstractControl;
  cja: AbstractControl;
}

/** Wires mutually exclusive enable/disable for court vs location+cja. */
export function attachLocationDisabler({
  court,
  location,
  cja,
}: LocationControls): Subscription {
  const has = (v: unknown) =>
    typeof v === 'string' ? v.trim().length > 0 : v !== null;

  const sync = () => {
    const hasCourt = has(court.value);
    const hasLoc = has(location.value);
    const hasCja = has(cja.value);

    if (hasCourt) {
      court.enable({ emitEvent: false });
      location.disable({ emitEvent: false });
      cja.disable({ emitEvent: false });
    } else if (hasLoc || hasCja) {
      court.disable({ emitEvent: false });
      location.enable({ emitEvent: false });
      cja.enable({ emitEvent: false });
    } else {
      court.enable({ emitEvent: false });
      location.enable({ emitEvent: false });
      cja.enable({ emitEvent: false });
    }
  };

  const sub = merge(
    court.valueChanges,
    location.valueChanges,
    cja.valueChanges,
  ).subscribe(sync);

  sync();
  return sub;
}
