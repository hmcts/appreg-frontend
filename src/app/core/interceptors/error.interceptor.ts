import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { ErrorHandler, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { ErrorMessageService } from '@services/error-message.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ErrorHandler);
  const router = inject(Router);
  const errorMessageService = inject(ErrorMessageService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          void router.navigate(['/login']);
        } else {
          errorMessageService.handleErrorMessage(error);
        }

        errorHandler.handleError(error);
      }

      return throwError(() => error);
    }),
  );
};
