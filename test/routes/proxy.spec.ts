import {
  type ClientRequest,
  type IncomingMessage,
  type Server,
  createServer,
  request as httpRequest,
} from 'node:http';
import type { AddressInfo } from 'node:net';
import { format } from 'node:util';

import type { TelemetryClient } from 'applicationinsights';
import express, { type RequestHandler } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import request from 'supertest';

import { createAuthenticatedApiProxyHandler } from '../../server/middleware/authenticated-api-proxy';
import { HmctsLoggerBridge } from '../../server/modules/logger';
import { toProxyForwardingLogMessage } from '../../server/utils/proxy-forwarding-log-message';

describe('HTTP proxy compatibility', () => {
  let upstream: Server;
  let target: string;
  let deprecations: string[];
  const collectWarning = (warning: Error & { code?: string }) => {
    if (warning.name === 'DeprecationWarning') {
      deprecations.push(warning.code ?? warning.message);
    }
  };

  async function listen(server: Server): Promise<string> {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        server.removeListener('error', reject);
        resolve();
      });
    });
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  }

  async function close(server: Server): Promise<void> {
    if (!server.listening) {
      return;
    }
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }

  beforeEach(async () => {
    deprecations = [];
    process.on('warning', collectWarning);
    upstream = createServer((req, res) => {
      if (req.url === '/download') {
        res.writeHead(200, {
          'content-type': 'application/octet-stream',
          'content-disposition': 'attachment; filename="sample.bin"',
        });
        res.write(Buffer.from([0, 1, 127]));
        res.end(Buffer.from([128, 255]));
        return;
      }
      if (req.url === '/failure') {
        res.writeHead(422, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ message: 'Validation failed' }));
        return;
      }
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      req.on('end', () => {
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            method: req.method,
            url: req.url,
            host: req.headers.host,
            forwardedHost: req.headers['x-forwarded-host'],
            contentType: req.headers['content-type'],
            proxyCheck: req.headers['x-proxy-check'],
            body: Buffer.concat(chunks).toString(),
          }),
        );
      });
    });
    target = await listen(upstream);
  });

  afterEach(async () => {
    await close(upstream);
    await new Promise<void>((resolve) => setImmediate(resolve));
    process.removeListener('warning', collectWarning);
    expect(deprecations).not.toContain('DEP0060');
  });

  function proxyApp() {
    const app = express();
    app.use(
      createProxyMiddleware({
        target,
        changeOrigin: true,
        xfwd: true,
        secure: true,
        on: {
          proxyReq: (proxyReq) =>
            proxyReq.setHeader('x-proxy-check', 'forwarded'),
        },
      }),
    );
    return app;
  }

  it('preserves paths and queries, rewrites Host and invokes the request hook', async () => {
    const response = await request(proxyApp())
      .get('/application-lists?filter=a%2Fb&sort=date')
      .expect(200);
    expect(response.body).toMatchObject({
      method: 'GET',
      url: '/application-lists?filter=a%2Fb&sort=date',
      host: new URL(target).host,
      proxyCheck: 'forwarded',
    });
    expect(response.body.forwardedHost).toBeTruthy();
  });

  it('streams JSON request bodies unchanged', async () => {
    const body = { description: 'Proxy regression check' };
    const response = await request(proxyApp())
      .post('/application-lists')
      .send(body)
      .expect(200);
    expect(response.body).toMatchObject({
      method: 'POST',
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });

  it('streams multipart uploads with their boundary intact', async () => {
    const response = await request(proxyApp())
      .post('/upload')
      .attach('file', Buffer.from('sample upload'), 'sample.txt')
      .expect(200);
    expect(response.body.contentType).toMatch(
      /^multipart\/form-data; boundary=/,
    );
    expect(response.body.body).toContain('sample upload');
    expect(response.body.body).toContain('filename="sample.txt"');
  });

  it('preserves binary downloads and response headers', async () => {
    const response = await request(proxyApp()).get('/download').expect(200);
    expect(response.headers['content-disposition']).toBe(
      'attachment; filename="sample.bin"',
    );
    expect(response.body).toEqual(Buffer.from([0, 1, 127, 128, 255]));
  });

  it('preserves upstream error statuses and bodies', async () => {
    const response = await request(proxyApp()).get('/failure').expect(422);
    expect(response.body).toEqual({ message: 'Validation failed' });
  });

  it('returns a gateway error when the upstream is unavailable', async () => {
    await close(upstream);
    await request(proxyApp()).get('/application-lists').expect(504);
  });

  it('forwards development WebSocket upgrades and socket data', async () => {
    upstream.on('upgrade', (_req, socket) => {
      socket.write(
        'HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n',
      );
      socket.pipe(socket);
    });
    const app = express();
    app.use(
      createProxyMiddleware({
        target,
        changeOrigin: true,
        ws: true,
        secure: false,
      }),
    );
    const frontend = createServer(app);
    const frontendUrl = await listen(frontend);

    try {
      // As in development, the initial page request installs the upgrade listener.
      await request(frontend).get('/').expect(200);
      await new Promise<void>((resolve, reject) => {
        const req = httpRequest(frontendUrl, {
          headers: { Connection: 'Upgrade', Upgrade: 'websocket' },
        });
        req.on('error', reject);
        req.on('upgrade', (res, socket) => {
          socket.setTimeout(2000, () =>
            socket.destroy(new Error('Upgrade timed out')),
          );
          socket.on('error', reject);
          socket.once('data', (data) => {
            socket.destroy();
            try {
              expect(res.statusCode).toBe(101);
              expect(data.toString()).toBe('proxy-check');
              resolve();
            } catch (error) {
              reject(error instanceof Error ? error : new Error(String(error)));
            }
          });
          socket.write('proxy-check');
        });
        req.end();
      });
    } finally {
      await close(frontend);
    }
  });
});

describe('API proxy logging of AI free text', () => {
  // Synthetic stand-ins for the free text people type into the AI features. The
  // first and last words are unique markers that survive every encoding a leak
  // could use (raw, percent-encoded, form-encoded or JSON-escaped).
  const aiRequests = [
    {
      field: 'question',
      path: '/application-list-entries/search-interpretations',
      text: 'qmark7f3c9a entries for a fictional applicant last week qmark7f3c9z',
      body: (text: string) => ({ question: text }),
    },
    {
      field: 'description',
      path: '/application-codes/suggestions',
      text: 'dmark4b8e21 a fictional licence application dmark4b8e2z',
      body: (text: string) => ({
        description: text,
        lodgementDate: '2026-01-05',
      }),
    },
  ];
  // Statuses the API documents for both AI POSTs, plus success.
  const apiStatuses = [200, 400, 401, 403, 422, 429, 500, 503, 504];
  const statusCases = aiRequests.flatMap((aiRequest) =>
    apiStatuses.map(
      (status) => [aiRequest.field, aiRequest.path, status, aiRequest] as const,
    ),
  );
  const apiToken = 'synthetic-api-token';

  // The bridge wraps the named HMCTS logger once, so one client records every
  // trace the proxy log line sends to App Insights.
  const telemetryClient = { trackException: jest.fn(), trackTrace: jest.fn() };
  const logger = HmctsLoggerBridge.enable(
    'hmcts applications register - server',
    telemetryClient as unknown as TelemetryClient,
  );

  let upstream: Server;
  let target: string;
  let upstreamStatus: number;
  let received: { url?: string; authorization?: string; body: string }[];
  let output: string[];
  let outputSpies: jest.SpyInstance[];

  function markersOf(text: string): string[] {
    const words = text.split(' ');
    return [words[0], words[words.length - 1]];
  }

  function expectFreeTextAbsent(captured: unknown, text: string): void {
    const serialised = JSON.stringify(captured);

    for (const marker of markersOf(text)) {
      expect(serialised).not.toContain(marker);
    }
  }

  // Everything the server could log: the HMCTS logger writes to stdout and
  // stderr, and anything else may use the console.
  function captureOutput(): void {
    output = [];
    outputSpies = [
      ...[process.stdout, process.stderr].map((stream) =>
        jest
          .spyOn(stream, 'write')
          .mockImplementation((chunk: string | Uint8Array) => {
            output.push(String(chunk));
            return true;
          }),
      ),
      ...(['debug', 'error', 'info', 'log', 'warn'] as const).map((method) =>
        jest.spyOn(console, method).mockImplementation((...args: unknown[]) => {
          output.push(format(...args));
        }),
      ),
    ];
  }

  function captured(responseText: string): unknown {
    return {
      output,
      response: responseText,
      trackException: telemetryClient.trackException.mock.calls,
      trackTrace: telemetryClient.trackTrace.mock.calls,
    };
  }

  // Mirrors the API proxy in server/server.ts: the same token handler, request
  // hook and log line, with no proxy logger (so the middleware's own is a no-op).
  function apiProxyApp(): express.Express {
    const apiProxy: RequestHandler = createProxyMiddleware({
      target,
      changeOrigin: true,
      xfwd: true,
      secure: false,
      on: {
        proxyReq: (
          proxyReq: ClientRequest,
          req: IncomingMessage & { apiAccessToken?: string | null },
        ) => {
          const token = req.apiAccessToken ?? null;
          logger.info(toProxyForwardingLogMessage(req.url, Boolean(token)));
          if (token) {
            proxyReq.setHeader('authorization', `Bearer ${token}`);
          }
        },
      },
    });
    const app = express();
    app.use(
      createAuthenticatedApiProxyHandler(
        () => Promise.resolve(apiToken),
        apiProxy,
      ),
    );
    return app;
  }

  function postAiRequest(url: string, body: object) {
    return request(apiProxyApp())
      .post(url)
      .set(
        'Accept',
        'application/vnd.hmcts.appreg.v1+json, application/problem+json',
      )
      .set('Content-Type', 'application/vnd.hmcts.appreg.v1+json')
      .send(JSON.stringify(body));
  }

  beforeEach(async () => {
    upstreamStatus = 200;
    received = [];
    upstream = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      req.on('end', () => {
        received.push({
          url: req.url,
          authorization: req.headers.authorization,
          body: Buffer.concat(chunks).toString(),
        });
        const failed = upstreamStatus >= 400;
        res.writeHead(upstreamStatus, {
          'content-type': failed
            ? 'application/problem+json'
            : 'application/vnd.hmcts.appreg.v1+json',
        });
        res.end(
          JSON.stringify(
            failed
              ? { type: 'about:blank', status: upstreamStatus, detail: 'Error' }
              : { notices: [] },
          ),
        );
      });
    });
    await new Promise<void>((resolve) =>
      upstream.listen(0, '127.0.0.1', resolve),
    );
    target = `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`;
    captureOutput();
  });

  afterEach(async () => {
    for (const spy of outputSpies) {
      spy.mockRestore();
    }
    if (upstream.listening) {
      upstream.closeAllConnections();
      await new Promise<void>((resolve) => upstream.close(() => resolve()));
    }
  });

  it.each(statusCases)(
    'keeps the %s out of the proxy log and its App Insights traces when POST %s gets %i',
    async (_field, path, status, aiRequest) => {
      upstreamStatus = status;
      const body = aiRequest.body(aiRequest.text);

      const response = await postAiRequest(path, body);

      expect(response.status).toBe(status);
      // The free text reached the API in the body, so the proxy handled it.
      expect(received).toEqual([
        {
          url: path,
          authorization: `Bearer ${apiToken}`,
          body: JSON.stringify(body),
        },
      ]);
      // The proxy logged the request and sent the line to App Insights.
      const forwarding = `[proxy] forwarding ${path} tokenPresent=true`;
      expect(output.join('')).toContain(forwarding);
      expect(telemetryClient.trackTrace).toHaveBeenCalledWith({
        message: forwarding,
        severity: 'Information',
      });
      expectFreeTextAbsent(captured(response.text), aiRequest.text);
    },
  );

  it.each(aiRequests)(
    'keeps the $field out of the proxy log when the API cannot be reached',
    async ({ path, text, body }) => {
      upstream.closeAllConnections();
      await new Promise<void>((resolve) => upstream.close(() => resolve()));

      const response = await postAiRequest(path, body(text));

      expect(response.status).toBe(504);
      expect(output.join('')).toContain(
        `[proxy] forwarding ${path} tokenPresent=true`,
      );
      expectFreeTextAbsent(captured(response.text), text);
    },
  );

  it.each(aiRequests)(
    'logs only the path when the $field reaches the query string',
    async ({ field, path, text, body }) => {
      const url = `${path}?${field}=${encodeURIComponent(text)}`;

      const response = await postAiRequest(url, body(text));

      expect(response.status).toBe(200);
      // The query still reaches the API; only the log copy is cut.
      expect(received[0].url).toBe(url);
      const forwarding = `[proxy] forwarding ${path} tokenPresent=true`;
      expect(output.join('')).toContain(forwarding);
      expect(telemetryClient.trackTrace).toHaveBeenCalledWith({
        message: forwarding,
        severity: 'Information',
      });
      expectFreeTextAbsent(captured(response.text), text);
    },
  );
});
