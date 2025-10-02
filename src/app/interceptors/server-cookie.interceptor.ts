import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { REQUEST } from '@nguniversal/express-engine/tokens';
import type { Request as ExpressRequest } from 'express';

export const serverCookieInterceptor: HttpInterceptorFn = (req, next) => {
  const expressReq = inject(REQUEST, { optional: true }) as
    | ExpressRequest
    | undefined;
  const cookie = expressReq?.headers?.cookie;
  return next(cookie ? req.clone({ setHeaders: { cookie } }) : req);
};
