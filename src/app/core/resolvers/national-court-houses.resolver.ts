import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';

import { NationalCourtHouse } from '../models/national-court-house';
import { NationalCourtHouseService } from '../services/national-court-houses.service';

export const nationalCourtHousesResolver: ResolveFn<
  NationalCourtHouse[]
> = () =>
  inject(NationalCourtHouseService)
    .getAllCourtLocations$()
    .pipe(
      take(1),
      catchError(() => of([])),
    );

export const nationalCourtHouseByIdResolver: ResolveFn<
  NationalCourtHouse | null
> = (route) =>
  inject(NationalCourtHouseService)
    .getCourtLocationById$(Number(route.paramMap.get('id')))
    .pipe(
      take(1),
      catchError(() => of(null)),
    );
