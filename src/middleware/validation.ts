import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../core/errors';

/**
 * Validation targets
 */
export type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validate request data against a Joi schema
 */
export const validate = (
  schema: Joi.ObjectSchema,
  target: ValidationTarget = 'body',
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const data = req[target];

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors: Record<string, string[]> = {};

      error.details.forEach((detail) => {
        const key = detail.path.join('.');
        if (!errors[key]) {
          errors[key] = [];
        }
        errors[key].push(detail.message);
      });

      return next(new ValidationError('Validation failed', errors));
    }

    // Replace request data with validated and sanitized values
    req[target] = value;
    next();
  };
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  id: Joi.object({
    id: Joi.string().uuid().required(),
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  search: Joi.object({
    q: Joi.string().min(1).max(100).optional(),
  }),
};
