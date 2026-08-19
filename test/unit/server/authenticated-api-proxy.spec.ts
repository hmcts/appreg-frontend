import type { Request, RequestHandler, Response } from 'express';

import { createAuthenticatedApiProxyHandler } from '../../../server/middleware/authenticated-api-proxy';

describe('createAuthenticatedApiProxyHandler', () => {
  const request = {} as Request & { apiAccessToken?: string | null };
  const sendStatus = jest.fn();
  const response = { sendStatus } as unknown as Response;
  const next = jest.fn();
  const apiProxyMock = jest.fn();
  const apiProxy = apiProxyMock as unknown as RequestHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    delete request.apiAccessToken;
  });

  it('returns 401 without calling the API proxy when no token is available', async () => {
    const handler = createAuthenticatedApiProxyHandler(
      () => Promise.resolve(null),
      apiProxy,
    );

    await handler(request, response, next);

    expect(sendStatus).toHaveBeenCalledWith(401);
    expect(apiProxyMock).not.toHaveBeenCalled();
  });

  it('forwards an authenticated request with its API access token', async () => {
    const handler = createAuthenticatedApiProxyHandler(
      () => Promise.resolve('access-token'),
      apiProxy,
    );

    await handler(request, response, next);

    expect(request.apiAccessToken).toBe('access-token');
    expect(apiProxyMock).toHaveBeenCalledWith(request, response, next);
    expect(sendStatus).not.toHaveBeenCalled();
  });
});
