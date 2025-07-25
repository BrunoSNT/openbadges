import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth-service';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    walletAddress: string;
    permissions: string[];
  };
}

export const authenticateJWT = (authService: AuthService) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const payload = authService.verifyToken(token);
    if (!payload) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = {
      userId: payload.userId,
      walletAddress: payload.walletAddress,
      permissions: payload.permissions
    };

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!req.user.permissions.includes(permission)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission
      });
      return;
    }

    next();
  };
};

export const requirePermissions = (permissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const hasAllPermissions = permissions.every(permission => 
      req.user!.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permissions,
        current: req.user.permissions
      });
      return;
    }

    next();
  };
};
