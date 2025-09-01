import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, Subject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { API_BASE_URL } from '../../api-base-url.token';
import { CourtHouse } from '../models/court-house';

@Injectable({ providedIn: 'root' })
export class CourthouseService {
  private readonly errorSubject = new Subject<string>();
  readonly error$ = this.errorSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly base: string,
  ) {}

  getAllCourtLocations$(): Observable<CourtHouse[]> {
    return this.http.get<CourtHouse[]>(`${this.base}/court-locations`).pipe(
      catchError((err: unknown) => {
        this.errorSubject.next(this.errorMsg(err));
        return of([]); // SSR: prerendering with empty list preventing error
      }),
    );
  }

  getCourtLocationById$(id: number): Observable<CourtHouse | null> {
    return this.http.get<CourtHouse>(`${this.base}/court-locations/${id}`).pipe(
      catchError((err: unknown) => {
        this.errorSubject.next(this.errorMsg(err));
        return of(null); // SSR: prerendering with null preventing error
      }),
    );
  }

  updateCourtLocation$(
    id: number,
    body: Partial<CourtHouse>,
  ): Observable<CourtHouse | null> {
    return this.http
      .put<CourtHouse>(`${this.base}/court-locations/${id}`, body)
      .pipe(
        catchError((err) => {
          this.errorSubject.next(this.errorMsg(err));
          return of(null as unknown as CourtHouse);
        }),
      );
  }

  private errorMsg(err: unknown): string {
    const e =
      err instanceof HttpErrorResponse
        ? err
        : new HttpErrorResponse({
            error: err,
            status: 0,
            statusText: 'Unknown Error',
          });

    if (e.status === 0) {
      return 'Unable to load court location. Please try again later"';
    }
    if (e.status === 404) {
      return 'Court location not found';
    }
    if (e.status >= 500) {
      return 'Server error.';
    }

    // Other error
    return `Error: ${e.message} (status: ${e.status})`;
  }
}
