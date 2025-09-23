import { Injectable, InjectionToken, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export const BASE_PATH = new InjectionToken<string>('BASE_PATH');

@Injectable()
export class ApplicationCodesApi {
  constructor(
    private http: HttpClient,
    @Optional() @Inject(BASE_PATH) private basePath: string = '',
  ) {}

  getApplicationCodes(params?: { page?: number; size?: number }) {
    return this.http.get(`${this.basePath}/application-codes`, {
      params: params as any,
    });
  }

  getApplicationCodeByCode(params: { code: string; date: string }) {
    const { code, date } = params;
    return this.http.get(
      `${this.basePath}/application-codes/${encodeURIComponent(code)}`,
      {
        params: { date },
      },
    );
  }
}
