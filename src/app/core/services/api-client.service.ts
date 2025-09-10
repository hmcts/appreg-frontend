import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpInterceptorFn,
  HttpParams,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ApiError {
  status: number;
  message: string | Record<string, unknown> | null;
  detail?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ErrorBus {
  private readonly subj = new Subject<string>();
  readonly error$ = this.subj.asObservable();
  notify(msg: string): void {
    this.subj.next(msg);
  }
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const toApiError = (e: unknown): ApiError => {
  const he =
    e instanceof HttpErrorResponse
      ? e
      : new HttpErrorResponse({ error: e, status: 0 });

  const raw: unknown = he.error;

  let message: ApiError['message'] = null;
  if (typeof raw === 'string') {
    message = raw;
  } else if (isObj(raw)) {
    message = raw;
  } else if (typeof he.message === 'string') {
    message = he.message;
  }

  const detail: string | null =
    typeof raw === 'string' ? raw : (he.message ?? null);
  return { status: he.status ?? 0, message, detail };
};

const errorMsg = (err: ApiError): string => {
  if (err.status === 0) {
    return 'Unable to load resource. Please try again later';
  }
  if (err.status === 404) {
    return 'Resource not found';
  }
  if (err.status >= 500) {
    return 'Server error.';
  }
  return 'Server error.';
};

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const base = 'http://localhost:4550'; // we need to change this in prod
  const bus = inject(ErrorBus);

  const isAbsolute = /^https?:\/\//i.test(req.url);
  const url = isAbsolute ? req.url : `${base}${req.url}`;
  const r = req.clone({ url, withCredentials: true });

  return next(r).pipe(
    catchError((err: unknown) => {
      const apiErr = toApiError(err);
      bus.notify(errorMsg(apiErr));
      return throwError(() => apiErr);
    }),
  );
};

type Params = Record<string, string | number | boolean | null | undefined>;
type HeadersInit = Record<string, string>;

@Injectable({ providedIn: 'root' })
export class ApiClient {
  constructor(private readonly http: HttpClient) {}

  get<T>(
    path: string,
    opts?: { params?: Params; headers?: HeadersInit },
  ): Observable<T> {
    return this.http.get<T>(path, this.options(opts));
  }
  post<T>(
    path: string,
    body: unknown,
    opts?: { params?: Params; headers?: HeadersInit },
  ): Observable<T> {
    return this.http.post<T>(path, body, this.options(opts));
  }
  put<T>(
    path: string,
    body: unknown,
    opts?: { params?: Params; headers?: HeadersInit },
  ): Observable<T> {
    return this.http.put<T>(path, body, this.options(opts));
  }
  patch<T>(
    path: string,
    body: unknown,
    opts?: { params?: Params; headers?: HeadersInit },
  ): Observable<T> {
    return this.http.patch<T>(path, body, this.options(opts));
  }
  delete<T>(
    path: string,
    opts?: { params?: Params; headers?: HeadersInit },
  ): Observable<T> {
    return this.http.delete<T>(path, this.options(opts));
  }

  private options(opts?: { params?: Params; headers?: HeadersInit }) {
    const params = new HttpParams({ fromObject: this.toParams(opts?.params) });
    const headers = new HttpHeaders(opts?.headers ?? {});
    return { params, headers };
  }
  private toParams(p?: Params) {
    const o: Record<string, string> = {};
    for (const [k, v] of Object.entries(p ?? {})) {
      if (v !== null && v !== undefined) {
        o[k] = String(v);
      }
    }
    return o;
  }
}
