import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApplicationCodes } from '../models/application-codes';

import { ApiClient } from './api-client.service';

type Page<T> = { content: T[]; totalElements?: number; totalPages?: number };
@Injectable({ providedIn: 'root' })
export class ApplicationCodesService {
  private readonly basePath = '/application-codes';
  constructor(private readonly api: ApiClient) {}

  getAllApplicationCodes$(): Observable<ApplicationCodes[]> {
    return this.api
      .get<Page<ApplicationCodes>>(this.basePath, { params: { size: 50 } })
      .pipe(
        map((res) => res?.content ?? []),
        catchError(() => of([])),
      );
  }

  getApplicationCodeById$(id: number): Observable<ApplicationCodes | null> {
    return this.api
      .get<ApplicationCodes>(`${this.basePath}/${id}`)
      .pipe(catchError(() => of(null)));
  }
}
