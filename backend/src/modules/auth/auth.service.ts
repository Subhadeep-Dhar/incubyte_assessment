import { User } from '../../models/user.model.js';
import { signToken } from '../../utils/jwt.util.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../utils/errors.js';
import { RegisterInput, LoginInput } from './auth.schema.js';

export interface AuthResponse {
  user: Record<string, unknown>;
  token: string;
}

export class AuthService {
  /**
   * Registers a new customer user, securely hashes the password, and issues a JWT.
   * Role is unconditionally set to 'customer' server-side to prevent privilege escalation.
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const normalizedEmail = input.email.trim().toLowerCase();

    // Check for existing user
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new ConflictError('Email address is already registered', 'EMAIL_ALREADY_EXISTS');
    }

    try {
      const user = await User.create({
        name: input.name.trim(),
        email: normalizedEmail,
        password: input.password,
        role: 'customer', // strictly server-enforced role
      });

      const token = signToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      return {
        user: user.toJSON(),
        token,
      };
    } catch (error: unknown) {
      // Handle race-condition MongoDB duplicate key error code 11000
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: number }).code === 11000
      ) {
        throw new ConflictError('Email address is already registered', 'EMAIL_ALREADY_EXISTS');
      }
      throw error;
    }
  }

  /**
   * Authenticates user credentials and issues a signed JWT.
   * Returns a generic error for both unknown email and incorrect password to prevent user enumeration.
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await user.comparePassword(input.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return {
      user: user.toJSON(),
      token,
    };
  }

  /**
   * Retrieves sanitized profile for currently authenticated user.
   */
  async getCurrentUser(userId: string): Promise<Record<string, unknown>> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User account not found', 'USER_NOT_FOUND');
    }

    return user.toJSON();
  }
}

export const authService = new AuthService();
