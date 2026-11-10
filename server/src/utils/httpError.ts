import { API_ERROR_CODES, type ApiErrorCode } from '@triyan/shared';

/** The only error type controllers should throw. The error handler maps it to the §6 envelope. */
export class HttpError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;
  readonly expose: boolean;

  constructor(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.expose = status < 500;
  }

  static badRequest(message = 'Invalid request', details?: unknown) {
    return new HttpError(400, API_ERROR_CODES.VALIDATION_FAILED, message, details);
  }
  static unauthenticated(message = 'Authentication required') {
    return new HttpError(401, API_ERROR_CODES.UNAUTHENTICATED, message);
  }
  static forbidden(message = 'Not permitted') {
    return new HttpError(403, API_ERROR_CODES.FORBIDDEN, message);
  }
  static notFound(message = 'Not found') {
    return new HttpError(404, API_ERROR_CODES.NOT_FOUND, message);
  }
  static conflict(message = 'Already exists', details?: unknown) {
    return new HttpError(409, API_ERROR_CODES.CONFLICT, message, details);
  }
  static rateLimited(message = 'Too many requests') {
    return new HttpError(429, API_ERROR_CODES.RATE_LIMITED, message);
  }
  static upstream(message = 'An upstream service is unavailable') {
    return new HttpError(503, API_ERROR_CODES.UPSTREAM_UNAVAILABLE, message);
  }
  static internal(message = 'Something went wrong') {
    return new HttpError(500, API_ERROR_CODES.INTERNAL, message);
  }
}
