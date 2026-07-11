import jwt, { type SignOptions, type JwtPayload } from 'jsonwebtoken';
import { config } from '../config/index.js';

export class JwtService {
  /**
   * Generate JWT access token.
   */
  static generateAccessToken(userId: string, organizationId: string): string {
    const options: SignOptions = {
      expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'],
      algorithm: 'HS256',
    };
    return jwt.sign(
      { id: userId, organizationId, type: 'access' },
      config.jwt.secret,
      options,
    );
  }

  /**
   * Generate JWT refresh token.
   */
  static generateRefreshToken(userId: string, organizationId: string): string {
    const options: SignOptions = {
      expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'],
      algorithm: 'HS256',
    };
    return jwt.sign(
      { id: userId, organizationId, type: 'refresh' },
      config.jwt.refreshSecret,
      options,
    );
  }

  /**
   * Validate JWT access token.
   */
  static validateAccessToken(token: string): { id: string; organizationId: string } | null {
    try {
      const decoded = jwt.verify(token, config.jwt.secret as string) as JwtPayload;
      if (typeof decoded.organizationId !== 'string') return null;
      return { id: decoded.id, organizationId: decoded.organizationId };
    } catch {
      return null;
    }
  }

  /**
   * Validate JWT refresh token.
   */
  static validateRefreshToken(token: string): { id: string; organizationId: string } | null {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret as string) as JwtPayload;
      if (typeof decoded.organizationId !== 'string') return null;
      return { id: decoded.id, organizationId: decoded.organizationId };
    } catch {
      return null;
    }
  }
}
