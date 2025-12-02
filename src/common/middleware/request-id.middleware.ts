import { NextFunction, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

export class RequestIdMiddleware {
  // eslint-disable-next-line class-methods-use-this
  use(req: Request, _res: Response, next: NextFunction) {
    const existing = req.headers['x-request-id'];
    req.requestId = typeof existing === 'string' ? existing : uuid();
    next();
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}
