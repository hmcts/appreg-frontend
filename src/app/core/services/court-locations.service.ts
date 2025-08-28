import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, lastValueFrom, throwError } from 'rxjs';

import { ApiError } from '../models/api-error';
import { CourtHouse } from '../models/court-house';

@Injectable({ providedIn: 'root' })
export class CourthouseService {
  constructor(private readonly http: HttpClient) {}

  private errorMessage(e: HttpErrorResponse): object | string {
    if (e.status === 0) {
      return {
        error: 'Unable to load court location. Please try again later',
        status: e.status,
        message: e.message,
      };
    }
    if (e.status === 404) {
      return {
        error: 'Court location not found',
        status: e.status,
        message: e.message,
      };
    }
    if (e.status >= 500) {
      return {
        error: 'Server error',
        status: e.status,
        message: e.message,
      };
    }

    // Fallback for other errors
    return `Error: ${e.message} (status: ${e.status})`;
  }

  private handleError(err: unknown): Observable<never> {
    const e = err as HttpErrorResponse;
    const apiError: ApiError = {
      status: e.status ?? 0,
      message: this.errorMessage(e) ?? null,
      detail: typeof e.error === 'string' ? e.error : e.message,
    };

    return throwError(() => apiError);
  }

  async getAllCourtLocations(): Promise<CourtHouse[]> {
    const data = await lastValueFrom(
      this.http.get<CourtHouse[]>('/court-locations').pipe(
        catchError((err) => {
          return this.handleError(err);
        }),
      ),
    );
    return data;
  }

  async getCourtLocationById(id: number): Promise<CourtHouse> {
    const data = await lastValueFrom(
      this.http.get<CourtHouse>(`/court-locations/${id}`).pipe(
        catchError((err) => {
          return this.handleError(err);
        }),
      ),
    );
    return data;
  }
}
