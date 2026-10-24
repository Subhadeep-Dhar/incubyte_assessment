import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: 'customer' | 'admin';
  iat?: number;
  exp?: number;
}

const SIGN_ALGORITHM: jwt.Algorithm = 'HS256';

/**
 * Signs a JWT with the configured secret, HS256 algorithm, and standard expiration.
 */
export function signToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = {
    algorithm: SIGN_ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}

/**
 * Verifies a JWT token signature and returns the decoded payload.
 * Strictly enforces HS256 algorithm to prevent algorithm confusion attacks.
 */
export function verifyToken(token: string): AuthTokenPayload {
  const options: VerifyOptions = {
    algorithms: [SIGN_ALGORITHM],
  };

  const decoded = jwt.verify(token, env.JWT_SECRET, options) as AuthTokenPayload;

  if (!decoded || typeof decoded !== 'object' || !decoded.userId || !decoded.role) {
    throw new Error('Invalid token claims structure');
  }

  return decoded;
}
