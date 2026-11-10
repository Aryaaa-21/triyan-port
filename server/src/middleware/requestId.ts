import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    /** Correlates a log line, an error response and a client report. */
    id?: string;
  }
}

export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const incoming = req.get('x-request-id');
  const id = incoming && /^[\w-]{1,64}$/.test(incoming) ? incoming : randomUUID();
  req.id = id;
  res.setHeader('x-request-id', id);
  next();
};
