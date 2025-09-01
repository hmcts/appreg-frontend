import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, firstValueFrom, of, take } from 'rxjs';

import { CourtHouse } from '../../../../../src/app/core/models/court-house';
import { CourthouseService } from '../../../../../src/app/core/services/court-locations.service';
import { CourtLocationsComponent } from '../../../../../src/app/pages/court-location/court-location.component';

describe('CourtLocationsComponent', () => {
  let fixture: ComponentFixture<CourtLocationsComponent>;
  let component: CourtLocationsComponent;

  const routeParam$ = new BehaviorSubject(convertToParamMap({} as never));
  const routerMock = { navigate: jest.fn() };

  const LIST: CourtHouse[] = [
    {
      id: 1,
      name: 'Demo Court',
      postcode: 'AB1 2CD',
      addressLines: ['1 St'],
      telephoneNo: 123,
      courtType: '',
    },
    {
      id: 2,
      name: 'Demo Court 2',
      postcode: 'AB1 2CD',
      addressLines: ['2 St'],
      telephoneNo: 456,
      courtType: '',
    },
  ];
  const DETAIL_2: CourtHouse = {
    id: 2,
    name: 'Demo Court 2',
    postcode: 'AB1 2CD',
    addressLines: ['2 St'],
    telephoneNo: 456,
    endDate: '01/01/2002',
    courtType: '',
  };

  const svcMock = {
    error$: new BehaviorSubject<string>(''),
    getAllCourtLocations$: jest.fn(() => of(LIST)),
    getCourtLocationById$: jest.fn((id: number) =>
      of(id === 2 ? DETAIL_2 : null),
    ),
    updateCourtLocation$: jest.fn((id: number, body: Partial<CourtHouse>) =>
      of({ ...(id === 2 ? DETAIL_2 : LIST[0]), ...body, id }),
    ),
  } as unknown as jest.Mocked<CourthouseService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [CourtLocationsComponent], // standalone
      providers: [
        { provide: CourthouseService, useValue: svcMock },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: routeParam$.asObservable() },
        },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CourtLocationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(svcMock['getAllCourtLocations$'] as jest.Mock).toHaveBeenCalledTimes(
      1,
    );
  });

  it('loads list into items$', async () => {
    const items = await firstValueFrom(component.items$.pipe(take(1)));
    expect(items).toEqual(LIST);
  });

  it('navigates on loadCourtById()', () => {
    component.loadCourtById(7);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/court-locations', 7]);
  });

  it('requests selected details when route id is present', () => {
    routeParam$.next(convertToParamMap({ id: '2' }));
    expect(svcMock['getCourtLocationById$'] as jest.Mock).toHaveBeenCalledWith(
      2,
    );
  });

  it('startEdit() populates form and sets editingId', () => {
    component.startEdit(DETAIL_2);
    expect(component.editingId).toBe(2);
    const v = component.form.getRawValue();
    expect(v.name).toBe(DETAIL_2.name);
    expect(v.postcode).toBe(DETAIL_2.postcode);
    expect(v.addressLines).toBe('2 St');
    expect(component.form.pristine).toBe(true);
  });

  it('date field validator rejects invalid date and range', () => {
    component.form.patchValue({ startDate: '31/02/2024' });
    component.form.get('startDate')?.markAsTouched();
    expect(component.form.get('startDate')?.errors).toEqual({
      dateFormat: true,
    });

    component.form.patchValue({
      startDate: '10/10/2024',
      endDate: '09/10/2024',
    });

    expect(component.form.errors).toEqual({ dateRange: true });
  });

  it('save() normalizes dates and calls update, then resets edit state', () => {
    component.startEdit(DETAIL_2);

    // Valid form
    component.form.patchValue({
      name: 'Updated',
      postcode: 'AB1 2CD',
      addressLines: '2 St',
      startDate: '2024-10-09',
      endDate: '10/10/2024',
    });

    component.form.markAsDirty();
    component.form.updateValueAndValidity();
    expect(component.form.valid).toBe(true);

    component.save();
    const updateMock = svcMock['updateCourtLocation$'] as jest.Mock;
    expect(updateMock).toHaveBeenCalledTimes(1); // Did it run?

    const call = updateMock.mock.calls.at(0);
    expect(call).toBeDefined();
    const [calledId, body] = call as [number, Partial<CourtHouse>];

    expect(calledId).toBe(2);
    expect(body).toMatchObject({
      name: 'Updated',
      startDate: '09/10/2024',
      endDate: '10/10/2024',
      addressLines: ['2 St'],
    });

    expect(component.editingId).toBeNull();
    expect(component.saving).toBe(false);
  });

  it('save() is a no-op when form is pristine or invalid', () => {
    component.startEdit(DETAIL_2);

    component.save();
    expect(svcMock['updateCourtLocation$'] as jest.Mock).toHaveBeenCalledTimes(
      0,
    );

    // make invalid range
    component.form.patchValue({
      startDate: '10/10/2024',
      endDate: '09/10/2024',
    });
    expect(component.form.invalid).toBe(true);
    component.save();
    expect(svcMock['updateCourtLocation$'] as jest.Mock).toHaveBeenCalledTimes(
      0,
    );
  });
});
