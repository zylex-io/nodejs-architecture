import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../core/errors';
import { sendError } from '../core/response';
import { logger } from '../core/logger';
import { config } from '../config';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    if (err instanceof ValidationError) {
      return sendError(res, err.message, err.statusCode, err.errors);
    }
    return sendError(res, err.message, err.statusCode);
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return sendError(res, 'Database operation failed', 400);
  }

  if (err.name === 'PrismaClientValidationError') {
    return sendError(res, 'Invalid data provided', 400);
  }

  // Handle syntax errors (malformed JSON)
  if (err instanceof SyntaxError && 'body' in err) {
    return sendError(res, 'Invalid JSON payload', 400);
  }

  // Unknown errors - don't leak details in production
  const message = config.isProduction
    ? 'An unexpected error occurred'
    : err.message;

  return sendError(res, message, 500);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  return sendError(res, `Route ${req.method} ${req.path} not found`, 404);
};
