import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { NationalCourtHouse } from '../models/national-court-house';

import { ApiClient } from './api-client.service';

type Page<T> = { content: T[]; totalElements?: number; totalPages?: number };
@Injectable({ providedIn: 'root' })
export class NationalCourtHouseService {
  private readonly basePath = '/national-court-houses';
  constructor(private readonly api: ApiClient) {}

  getAllCourtLocations$(): Observable<NationalCourtHouse[]> {
    return this.api
      .get<Page<NationalCourtHouse>>(this.basePath, { params: { size: 50 } })
      .pipe(
        map((res) => res?.content ?? []),
        catchError((err) => {
          console.error('[fetch failed]', err);
          return of([]);
        }),
      );
  }

  getCourtLocationById$(id: number): Observable<NationalCourtHouse | null> {
    return this.api.get<NationalCourtHouse>(`${this.basePath}/${id}`).pipe(
      catchError((err) => {
        console.error('[fetch failed]', err);
        return of(null);
      }),
    );
  }

  updateCourtLocation$(
    id: number,
    body: Partial<NationalCourtHouse>,
  ): Observable<NationalCourtHouse | null> {
    return this.api
      .patch<NationalCourtHouse>(`${this.basePath}/${id}`, body)
      .pipe(catchError(() => of(null)));
  }
}
