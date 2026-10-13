import { type Server, createServer, request as httpRequest } from 'node:http';
import type { AddressInfo } from 'node:net';

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import request from 'supertest';

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
