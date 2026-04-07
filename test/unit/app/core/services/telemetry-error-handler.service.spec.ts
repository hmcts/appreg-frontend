import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { TelemetryErrorHandler } from '@services/telemetry-error-handler.service';
import { TelemetryService } from '@services/telemetry.service';

describe('TelemetryErrorHandler', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let handler: TelemetryErrorHandler;
  let telemetryService: { logException: jest.Mock };

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    telemetryService = {
      logException: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TelemetryErrorHandler,
        { provide: TelemetryService, useValue: telemetryService },
      ],
    });

    handler = TestBed.inject(TelemetryErrorHandler);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('sends non-http errors to telemetry', () => {
    const error = new Error('boom');

    handler.handleError(error);

    expect(telemetryService.logException).toHaveBeenCalledWith(error, {
      handledBy: 'global-error-handler',
    });
  });

  it('does not duplicate http errors already tracked by the interceptor', () => {
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Server Error',
      url: '/application-lists',
    });

    handler.handleError(error);

    expect(telemetryService.logException).not.toHaveBeenCalled();
  });
});
