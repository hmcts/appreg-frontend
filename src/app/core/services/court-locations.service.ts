import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { CourtHouse } from '../models/court-house';

import { ApiClient } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class CourthouseService {
  private readonly basePath = '/national-court-houses';
  constructor(private readonly api: ApiClient) {}

  getAllCourtLocations$(): Observable<CourtHouse[]> {
    return this.api.get<CourtHouse[]>(this.basePath).pipe(
      catchError(() => of([])), // Return null for SSR prerendering
    );
  }

  getCourtLocationById$(id: number): Observable<CourtHouse | null> {
    return this.api
      .get<CourtHouse>(`${this.basePath}/${id}`)
      .pipe(catchError(() => of(null)));
  }

  updateCourtLocation$(
    id: number,
    body: Partial<CourtHouse>,
  ): Observable<CourtHouse | null> {
    return this.api
      .patch<CourtHouse>(`${this.basePath}/${id}`, body)
      .pipe(catchError(() => of(null)));
  }
}
