import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

import * as express from 'express';
import helmet from 'helmet';

const self = "'self'";
// Helmet expects (IncomingMessage, ServerResponse) so read nonce from res.locals
const nonceDirective = (_req: IncomingMessage, res: ServerResponse): string =>
  `'nonce-${(res as { locals?: Record<string, string> }).locals?.['cspNonce'] ?? ''}'`;

/**
 * Module that enables helmet in the application
 */
export class Helmet {
  private readonly developmentMode: boolean;
  constructor(developmentMode: boolean) {
    this.developmentMode = developmentMode;
  }

  public enableFor(app: express.Express): void {
    app.use((_req, res, next) => {
      // Generate a per-response nonce for CSP so we can inject it into inline scripts
      res.locals['cspNonce'] = crypto.randomBytes(16).toString('base64');
      next();
    });

    const scriptSrc = [self, nonceDirective];

    if (this.developmentMode) {
      // Uncaught EvalError: Refused to evaluate a string as JavaScript because 'unsafe-eval'
      // is not an allowed source of script in the following Content Security Policy directive:
      // "script-src 'self' *.google-analytics.com 'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='".
      // seems to be related to webpack
      scriptSrc.push("'unsafe-eval'", "'unsafe-inline'");
    }

    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            connectSrc: ["'self'", 'http://localhost:4550'],
            defaultSrc: ["'self'", 'http://localhost:4550'],
            fontSrc: [self, 'data:'],
            imgSrc: [self],
            objectSrc: [self],
            scriptSrc,
            styleSrc: [self, "'unsafe-inline'"],
          },
        },
        referrerPolicy: { policy: 'origin' },
      }),
    );
  }
}
