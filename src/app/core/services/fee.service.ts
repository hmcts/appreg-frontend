import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Fee, FeeSearchParams } from '../models/fee';

import { ApiClient } from './api-client.service';

type Page<T> = { content: T[]; totalElements?: number; totalPages?: number };
@Injectable({ providedIn: 'root' })
export class FeeService {
  private readonly basePath = '/fee';
  constructor(private readonly api: ApiClient) {}

  getFeePage$(params: FeeSearchParams = {}): Observable<Page<Fee>> {
    const ref = params.reference?.trim();
    const s = params.startDate?.trim();
    const e = params.endDate?.trim();

    const qp = {
      reference: ref || undefined,
      startDate: s || undefined,
      endDate: e || undefined,
      value: params.value ?? undefined,
      page: params.page ?? 1,
      size: params.size ?? 10,
    } satisfies Record<string, string | number | undefined>;

    const emptyPage: Page<Fee> = {
      content: [],
      totalElements: 0,
      totalPages: 0,
    };

    const req$: Observable<Page<Fee>> = this.api.get<Page<Fee>>(this.basePath, {
      params: qp,
    });

    return req$.pipe(
      map((res) => res ?? emptyPage),
      catchError(() => of(emptyPage)),
    );
  }
  
  getAllFee$(params: FeeSearchParams = {}): Observable<Fee[]> {
    return this.getFeePage$(params).pipe(map((res) => res.content));
  }

  getFeeById$(id: number): Observable<Fee | null> {
    return this.api
      .get<Fee>(`${this.basePath}/${id}`)
      .pipe(catchError(() => of(null)));
  }
}
