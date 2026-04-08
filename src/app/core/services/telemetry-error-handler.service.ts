import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable, inject } from '@angular/core';

import { TelemetryService } from '@services/telemetry.service';

@Injectable({ providedIn: 'root' })
export class TelemetryErrorHandler implements ErrorHandler {
  private readonly telemetryService = inject(TelemetryService);
  private readonly delegate = new ErrorHandler();

  handleError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.telemetryService.logException(coerceError(error), {
        handledBy: 'global-error-handler',
      });
    }

    this.delegate.handleError(error);
  }
}

function coerceError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === 'string' ? error : 'Unknown browser error');
}
