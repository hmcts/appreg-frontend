import type { NextFunction, Request, RequestHandler, Response } from 'express';

type RequestWithApiAccessToken = Request & {
  apiAccessToken?: string | null;
};

export type ApiTokenAcquirer = (req: Request) => Promise<string | null>;

export function createAuthenticatedApiProxyHandler(
  acquireToken: ApiTokenAcquirer,
  apiProxy: RequestHandler,
): RequestHandler {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const token = await acquireToken(req);

    if (!token) {
      res.sendStatus(401);
      return;
    }

    (req as RequestWithApiAccessToken).apiAccessToken = token;
    apiProxy(req, res, next);
  };
}
