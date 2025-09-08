import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Fee } from '../models/fee';

import { ApiClient } from './api-client.service';

type Page<T> = { content: T[]; totalElements?: number; totalPages?: number };
@Injectable({ providedIn: 'root' })
export class FeeService {
  private readonly basePath = '/fee';
  constructor(private readonly api: ApiClient) {}

  getAllFee$(): Observable<Fee[]> {
    return this.api
      .get<Page<Fee>>(this.basePath, { params: { size: 50 } })
      .pipe(
        map((res) => res?.content ?? []),
        catchError(() => of([])),
      );
  }

  getFeeById$(id: number): Observable<Fee | null> {
    return this.api
      .get<Fee>(`${this.basePath}/${id}`)
      .pipe(catchError(() => of(null)));
  }
}
