import { HttpInterceptorFn } from '@angular/common/http';

import { IF_MATCH, ROW_VERSION } from '../context/concurrency-context';

export const concurrencyHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  const etag = req.context.get(IF_MATCH);
  const rowVersion = req.context.get(ROW_VERSION);
  return next(
    etag || rowVersion
      ? req.clone({ setHeaders: {
          ...(etag ? { 'If-Match': etag } : {}),
          ...(rowVersion ? { 'X-Row-Version': rowVersion } : {}),
        } })
      : req,
  );
};
