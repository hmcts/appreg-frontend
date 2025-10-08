import { HttpInterceptorFn } from '@angular/common/http';
import { REQUEST, inject } from '@angular/core';
import type { Request as ExpressRequest } from 'express';

export const serverCookieInterceptor: HttpInterceptorFn = (req, next) => {
  const expressReq = inject(REQUEST, { optional: true }) as unknown as
    | ExpressRequest
    | undefined;
  const cookie = expressReq?.headers?.cookie;
  return next(cookie ? req.clone({ setHeaders: { cookie } }) : req);
};
