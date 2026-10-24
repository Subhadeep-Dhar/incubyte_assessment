import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util.js';
import { UserRole } from '../models/user.model.js';

export interface AuthenticatedUserContext {
  id: string;
  email: string;
  role: UserRole;
}

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserContext;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

/**
 * Middleware that authenticates JWT bearer tokens in the Authorization header.
 * Derives user context directly from the cryptographically verified token.
 */
export function authenticateJwt(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is missing or malformed',
      },
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (_error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is invalid or has expired',
      },
    });
  }
}

/**
 * Middleware that enforces Role-Based Access Control (RBAC).
 * Requires the request to have already passed authenticateJwt.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required prior to authorization check',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]`,
        },
      });
      return;
    }

    next();
  };
}
