import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../core/errors';

/**
 * Authentication middleware placeholder
 * Replace with your actual authentication logic (JWT, session, etc.)
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Verify authentication token
 */
export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    // TODO: Implement your token verification logic here
    // Example with JWT:
    // const decoded = jwt.verify(token, config.jwt.secret);
    // req.user = decoded;

    // Placeholder - remove in actual implementation
    if (!token) {
      throw new UnauthorizedError('Invalid token');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has required role
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // TODO: Implement token verification
      // If valid, set req.user
      if (token) {
        // Placeholder
      }
    }

    next();
  } catch {
    // Ignore errors for optional auth
    next();
  }
};
