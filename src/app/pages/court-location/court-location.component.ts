import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  merge,
  of,
} from 'rxjs';
import { map, startWith, switchMap, take } from 'rxjs/operators';

import { CourtHouse } from '../../core/models/court-house';
import { ErrorBus } from '../../core/services/api-client.service';
import { CourthouseService } from '../../core/services/court-locations.service';

@Component({
  selector: 'app-court-locations',
  standalone: true,
  templateUrl: 'court-location.component.html',
  imports: [AsyncPipe, ReactiveFormsModule],
})
export class CourtLocationsComponent {
  private readonly svc = inject(CourthouseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  private readonly required: ValidatorFn = (
    c: AbstractControl<unknown, unknown, unknown>,
  ): ValidationErrors | null => Validators.required(c);

  // local stores
  private readonly itemsSubject = new BehaviorSubject<CourtHouse[]>([]);
  readonly items$ = this.itemsSubject.asObservable();

  private readonly selectedOverride$ = new BehaviorSubject<CourtHouse | null>(
    null,
  );
  private readonly refreshSelected$ = new Subject<void>();

  constructor() {
    this.reloadItems();
  }

  private readonly dateFlexible: ValidatorFn = (
    c: AbstractControl,
  ): ValidationErrors | null => {
    const v: unknown = (c as AbstractControl<unknown>).value;
    if (v === null || v === '') {
      return null;
    }
    if (typeof v !== 'string') {
      return { dateFormat: true };
    } // reject objects/numbers
    const raw = v.trim();
    return raw && this.parseToDMY(raw) ? null : { dateFormat: true };
  };

  private normalizeToDDMMYYYY(raw: string | null): string | null {
    if (!raw) {
      return null;
    }
    const p = this.parseToDMY(raw);
    return p ? this.toDDMMYYYY(p.d, p.m, p.y) : null;
  }

  // Parse several formats into DD/MM/YYYY
  private parseToDMY(s: string): { d: number; m: number; y: number } | null {
    const str = s.trim();

    // DD/MM/YYYY or DD-MM-YYYY
    let m = RegExp(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/).exec(str);
    if (m) {
      return this.validDMY(+m[1], +m[2], +m[3])
        ? { d: +m[1], m: +m[2], y: +m[3] }
        : null;
    }

    // YYYY-MM-DD
    m = RegExp(/^(\d{4})-(\d{2})-(\d{2})$/).exec(str);
    if (m) {
      return this.validDMY(+m[3], +m[2], +m[1])
        ? { d: +m[3], m: +m[2], y: +m[1] }
        : null;
    }

    // YYYY/MM/DD
    m = RegExp(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/).exec(str);
    if (m) {
      return this.validDMY(+m[3], +m[2], +m[1])
        ? { d: +m[3], m: +m[2], y: +m[1] }
        : null;
    }

    return null; // deliberately do not guess MM/DD/YYYY
  }

  private validDMY(d: number, m: number, y: number): boolean {
    if (m < 1 || m > 12 || d < 1) {
      return false;
    }
    const dim = [
      31,
      this.leap(y) ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];
    return d <= dim[m - 1];
  }
  private leap(y: number): boolean {
    return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  }

  private toDDMMYYYY(d: number, m: number, y: number): string {
    const dd = d.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    return `${dd}/${mm}/${y}`;
  }

  private cmpDMY(
    a: { d: number; m: number; y: number },
    b: { d: number; m: number; y: number },
  ): number {
    if (a.y !== b.y) {
      return a.y - b.y;
    }
    if (a.m !== b.m) {
      return a.m - b.m;
    }
    return a.d - b.d;
  }

  private readonly dateRange: ValidatorFn = (
    ctrl: AbstractControl,
  ): ValidationErrors | null => {
    const g = ctrl as FormGroup<{
      startDate: import('@angular/forms').FormControl<string | null>;
      endDate: import('@angular/forms').FormControl<string | null>;
    }>;

    const s = g.controls.startDate.value;
    const e = g.controls.endDate.value;

    if (!s || !e) {
      return null;
    }
    const ps = this.parseToDMY(s.trim());
    const pe = this.parseToDMY(e.trim());
    if (!ps || !pe) {
      return null;
    }

    return this.cmpDMY(ps, pe) <= 0 ? null : { dateRange: true };
  };

  private readonly selectedFromRoute$: Observable<CourtHouse | null> =
    combineLatest([
      this.route.paramMap,
      this.refreshSelected$.pipe(startWith<void>(undefined)),
    ]).pipe(
      map(([p]) => p.get('id')),
      switchMap((id) => (id ? this.svc.getCourtLocationById$(+id) : of(null))),
    );

  readonly selected$: Observable<CourtHouse | null> = merge(
    this.selectedOverride$,
    this.selectedFromRoute_,
  );

  private get selectedFromRoute_() {
    return this.selectedFromRoute$;
  }

  loadCourtById(id: number): void {
    void this.router.navigate(['/national-court-houses', id]);
  }

  readonly error$ = inject(ErrorBus).error$;

  editingId: number | null = null;
  saving = false;

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', [this.required, Validators.maxLength(120)]],
      welshName: this.fb.control<string | null>(null),
      courtType: this.fb.control<string | null>(null),
      courtLocationCode: this.fb.control<string | null>(null),
      startDate: this.fb.control<string | null>(null, {
        validators: [this.dateFlexible],
      }),
      endDate: this.fb.control<string | null>(null, {
        validators: [this.dateFlexible],
      }),
    },
    { validators: [this.dateRange] },
  );

  startEdit(c: CourtHouse): void {
    this.editingId = c.id;
    this.form.reset({
      name: c.name ?? '',
      welshName: c.welshName ?? null,
      courtType: c.courtType ?? null,
      courtLocationCode: c.courtLocationCode ?? null,
      startDate: c.startDate ?? null,
      endDate: c.endDate ?? null,
    });
    this.form.markAsPristine();
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset();
  }

  save(): void {
    if (
      !this.editingId ||
      this.form.invalid ||
      this.saving ||
      this.form.pristine
    ) {
      return;
    }

    const v = this.form.getRawValue();
    const body = {
      name: v.name,
      welshName: v.welshName ?? null,
      courtType: v.courtType ?? null,
      courtLocationCode: v.courtLocationCode ?? null,
      startDate: this.normalizeToDDMMYYYY(v.startDate),
      endDate: this.normalizeToDDMMYYYY(v.endDate),
    } as Partial<Omit<CourtHouse, 'id'>>;

    this.saving = true;
    this.svc
      .updateCourtLocation$(this.editingId, body)
      .pipe(take(1))
      .subscribe({
        next: (updated) => {
          if (updated) {
            this.selectedOverride$.next(updated);
            const list = this.itemsSubject.getValue();
            const idx = list.findIndex((x) => x.id === updated.id);
            const next =
              idx >= 0
                ? [...list.slice(0, idx), updated, ...list.slice(idx + 1)]
                : [updated, ...list];
            this.itemsSubject.next(next);
          }
          this.saving = false;
          this.form.markAsPristine();
          this.editingId = null;
          this.refreshSelected$.next();
        },
        error: () => {
          this.saving = false;
        },
      });
  }

  private reloadItems(): void {
    this.svc
      .getAllCourtLocations$()
      .pipe(take(1))
      .subscribe((items) => this.itemsSubject.next(items));
  }

  get saveLabel(): string {
    if (this.saving) {
      return 'Saving…';
    }
    if (this.form.dirty) {
      return 'Save changes';
    }
    return 'Save';
  }

  get saveTitle(): string {
    if (this.saving) {
      return 'Saving your changes';
    }
    if (this.form.dirty) {
      return 'You have unsaved changes. Click to save.';
    }
    return 'No changes to save';
  }

  get cancelLabel(): string {
    if (this.form.dirty) {
      return 'Discard';
    }
    return 'Close';
  }

  get cancelTitle(): string {
    if (this.form.dirty) {
      return 'Discard changes';
    }
    return 'Close';
  }
}
