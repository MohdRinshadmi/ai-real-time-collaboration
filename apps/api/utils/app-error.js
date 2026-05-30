// A typed HTTP error. Services and middleware throw these; the global error
// handler turns them into a shape-consistent JSON response. Replaces NestJS's
// HttpException hierarchy.
export class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    // Mark as expected so the handler doesn't log it as an unhandled crash.
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

// Convenience factories mirroring the exceptions the NestJS code used.
export const badRequest = (msg = 'bad request', details) => new AppError(400, msg, details);
export const unauthorized = (msg = 'unauthorized') => new AppError(401, msg);
export const forbidden = (msg = 'forbidden') => new AppError(403, msg);
export const notFound = (msg = 'not found') => new AppError(404, msg);
export const conflict = (msg = 'conflict') => new AppError(409, msg);
