import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { API_ERROR_CODES, type ApiErrorBody } from '@triyan/shared';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../config/logger.js';
import { isProduction } from '../config/env.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(HttpError.notFound(`No route matches ${req.method} ${req.path}`));
};

const asHttpError = (error: unknown): HttpError => {
  if (error instanceof HttpError) return error;

  if (error instanceof ZodError) {
    return HttpError.badRequest(
      'The request did not pass validation',
      error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }

  // Mongoose duplicate key
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
    return HttpError.conflict('That record already exists');
  }

  return HttpError.internal();
};

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const httpError = asHttpError(error);

  const log = logger.child({ requestId: req.id, path: req.path, method: req.method });
  if (httpError.status >= 500) {
    log.error({ err: error }, 'Request failed');
  } else {
    log.warn({ code: httpError.code, status: httpError.status }, httpError.message);
  }

  const body: ApiErrorBody = {
    error: {
      code: httpError.code,
      message:
        httpError.expose || !isProduction
          ? httpError.message
          : 'Something went wrong. The failure has been logged.',
      ...(httpError.details === undefined ? {} : { details: httpError.details }),
      ...(req.id ? { requestId: req.id } : {}),
    },
  };

  if (httpError.code === API_ERROR_CODES.INTERNAL) res.setHeader('Cache-Control', 'no-store');
  res.status(httpError.status).json(body);
};
