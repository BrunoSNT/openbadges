import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  walletAddress: string;
  permissions: string[];
  exp: number;
  iat: number;
}

export interface UserClaims {
  userId: string;
  walletAddress: string;
  permissions: string[];
}

export class AuthService {
  private secretKey: string;
  private expiresIn: string;

  constructor(secretKey: string, expiresIn: string = '24h') {
    if (!secretKey || secretKey.length < 32) {
      throw new Error('JWT secret key must be at least 32 characters long');
    }
    this.secretKey = secretKey;
    this.expiresIn = expiresIn;
  }

  /**
   * Generate a JWT token for a user
   */
  generateToken(userId: string, walletAddress: string, permissions: string[] = []): string {
    const payload: Omit<JWTPayload, 'exp' | 'iat'> = {
      userId,
      walletAddress,
      permissions,
    };
    
    return jwt.sign(payload, this.secretKey, { 
      expiresIn: this.expiresIn,
      algorithm: 'HS256'
    } as jwt.SignOptions);
  }

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.secretKey, {
        algorithms: ['HS256']
      }) as JWTPayload;
      
      return decoded;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  /**
   * Extract wallet address from token without full verification
   */
  extractWalletAddress(token: string): string | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded?.walletAddress || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract user claims from token
   */
  extractUserClaims(token: string): UserClaims | null {
    const payload = this.verifyToken(token);
    if (!payload) return null;

    return {
      userId: payload.userId,
      walletAddress: payload.walletAddress,
      permissions: payload.permissions
    };
  }

  /**
   * Check if token has specific permission
   */
  hasPermission(token: string, permission: string): boolean {
    const claims = this.extractUserClaims(token);
    return claims?.permissions.includes(permission) || false;
  }

  /**
   * Refresh token (generate new token with same claims)
   */
  refreshToken(token: string): string | null {
    const claims = this.extractUserClaims(token);
    if (!claims) return null;

    return this.generateToken(claims.userId, claims.walletAddress, claims.permissions);
  }
}
