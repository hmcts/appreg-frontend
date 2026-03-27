import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import {
  ErrorDisplay,
  ErrorMessage,
  ProblemDetails,
} from '@core-types/error/http-error.types';

type EndpointRule = { endpoint: string | RegExp; responses: number[] };

// Contains endpoints where errors are handled in their component
const regexIdPlaceholder = '[0-9a-fA-F-]{36}';

const subscribedEndpoints: EndpointRule[] = [
  { endpoint: '/application-lists', responses: [400, 403, 404, 406, 500] },
  { endpoint: '/application-codes', responses: [400, 403, 406, 500] },

  {
    endpoint: new RegExp(`^/application-codes/${regexIdPlaceholder}$`),
    responses: [400, 403, 413, 415, 500],
  },
  {
    endpoint: new RegExp(
      `^/application-lists/${regexIdPlaceholder}/entries/bulk-import$`,
    ),
    responses: [400, 403, 413, 415, 500],
  },
  {
    endpoint: new RegExp(`^/jobs/${regexIdPlaceholder}$`),
    responses: [400, 403, 404, 500],
  },
  {
    endpoint: new RegExp(`^/application-lists/${regexIdPlaceholder}$`),
    responses: [400, 403, 404, 409, 500],
  },
  {
    endpoint: new RegExp(`^/application-lists/${regexIdPlaceholder}/entries$`),
    responses: [400, 403, 404, 409, 500],
  },
  {
    endpoint: new RegExp(
      `^/application-lists/${regexIdPlaceholder}/entries/${regexIdPlaceholder}$`,
    ),
    responses: [400, 403, 404, 409, 500],
  },
  {
    endpoint: new RegExp(
      `^/application-lists/${regexIdPlaceholder}/entries/${regexIdPlaceholder}/results$`,
    ),
    responses: [400, 403, 500],
  },
];

// Contains endpoints where errors will be ignored
const ignoredEndpoints: EndpointRule[] = [
  { endpoint: '/sso/me', responses: [0, 500, 502, 504] },
];

@Injectable({ providedIn: 'root' })
export class ErrorMessageService {
  private readonly router = inject(Router);

  private readonly _errorMessage = signal<ErrorMessage | null>(null);

  readonly errorMessage = this._errorMessage.asReadonly();

  /**
   * Main entry point (call from interceptor).
   * - Sets an error message (if not ignored)
   * - Navigates to global error pages for non-subscribed/non-ignored endpoints
   */
  handleErrorMessage(error: HttpErrorResponse): void {
    if (!this.isIgnored(error) && error.error !== null) {
      const detail = coerceProblemDetails(error.error);

      this.setErrorMessage({
        status: error.status,
        statusText: error.statusText,
        endpoint: error.url ?? undefined,
        detail: detail ?? undefined,
      });
    }

    this.handleOtherPages(error);
  }

  setErrorMessage(error: ErrorMessage): void {
    this._errorMessage.set(error);
  }

  clearErrorMessage(): void {
    this._errorMessage.set(null);
  }

  updateDisplayType(type: ErrorDisplay): void {
    const current = this._errorMessage();
    if (!current) {
      return;
    }

    this._errorMessage.set({ ...current, display: type });
  }

  private handleOtherPages(error: HttpErrorResponse): void {
    if (this.isSubscribed(error) || this.isIgnored(error)) {
      return;
    }

    switch (error.status) {
      case 403:
        this.showForbidden();
        break;
      case 404:
        this.showNotFound();
        break;
      case 500:
      default:
        this.showInternalError();
        break;
    }
  }

  private isSubscribed(response: HttpErrorResponse): boolean {
    const path = getPathname(response.url);

    return subscribedEndpoints.some((rule) => {
      const endpointMatches =
        typeof rule.endpoint === 'string'
          ? path.startsWith(rule.endpoint)
          : rule.endpoint.test(path);

      return endpointMatches && rule.responses.includes(response.status);
    });
  }

  private isIgnored(response: HttpErrorResponse): boolean {
    const path = getPathname(response.url);

    return ignoredEndpoints.some((rule) => {
      const endpointMatches =
        typeof rule.endpoint === 'string'
          ? path.startsWith(rule.endpoint)
          : rule.endpoint.test(path);

      return endpointMatches && rule.responses.includes(response.status);
    });
  }

  private showGlobalErrorPage(route: string): void {
    void this.router.navigateByUrl(route);
  }

  private showForbidden(): void {
    this.showGlobalErrorPage('/forbidden');
  }

  private showNotFound(): void {
    this.showGlobalErrorPage('/page-not-found');
  }

  private showInternalError(): void {
    this.showGlobalErrorPage('/internal-error');
  }
}

function getPathname(url: string | null | undefined): string {
  if (!url) {
    return '';
  }
  try {
    return new URL(url, 'https://local').pathname;
  } catch {
    const q = url.indexOf('?');
    const h = url.indexOf('#');
    const cut = Math.min(q === -1 ? url.length : q, h === -1 ? url.length : h);
    return url.slice(0, cut);
  }
}

function coerceProblemDetails(value: unknown): ProblemDetails | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const v = value as Record<string, unknown>;
  const hasAnyKey =
    'type' in v ||
    'title' in v ||
    'status' in v ||
    'detail' in v ||
    'instance' in v;

  return hasAnyKey ? (v as ProblemDetails) : null;
}
