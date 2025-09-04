import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ResolutionCodes } from '../models/resolution-codes';

import { ApiClient } from './api-client.service';

type Page<T> = { content: T[]; totalElements?: number; totalPages?: number };
@Injectable({ providedIn: 'root' })
export class ResolutionCodesService {
  private readonly basePath = '/resolution-codes';
  constructor(private readonly api: ApiClient) {}

  getAllResolutionCodes$(): Observable<ResolutionCodes[]> {
    return this.api
      .get<Page<ResolutionCodes>>(this.basePath, { params: { size: 50 } })
      .pipe(
        map((res) => res?.content ?? []),
        catchError(() => of([])),
      );
  }

  getResolutionCodeById$(id: number): Observable<ResolutionCodes | null> {
    return this.api
      .get<ResolutionCodes>(`${this.basePath}/${id}`)
      .pipe(catchError(() => of(null)));
  }
}
