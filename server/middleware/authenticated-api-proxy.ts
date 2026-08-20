import type { NextFunction, Request, RequestHandler, Response } from 'express';

type RequestWithApiAccessToken = Request & {
  apiAccessToken?: string | null;
};

export type ApiTokenAcquirer = (req: Request) => Promise<string | null>;
export type UnauthenticatedResponseLogger = (req: Request) => void;

export function createAuthenticatedApiProxyHandler(
  acquireToken: ApiTokenAcquirer,
  apiProxy: RequestHandler,
  logUnauthenticatedResponse?: UnauthenticatedResponseLogger,
): RequestHandler {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const token = await acquireToken(req);

    if (!token) {
      logUnauthenticatedResponse?.(req);
      res.sendStatus(401);
      return;
    }

    (req as RequestWithApiAccessToken).apiAccessToken = token;
    apiProxy(req, res, next);
  };
}
