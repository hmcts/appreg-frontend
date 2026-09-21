import { HttpInterceptorFn } from '@angular/common/http';
import { REQUEST, inject } from '@angular/core';

export const serverCookieInterceptor: HttpInterceptorFn = (req, next) => {
  const request = inject(REQUEST, { optional: true });
  const cookie = request?.headers.get('cookie');

  return next(cookie ? req.clone({ setHeaders: { cookie } }) : req);
};
