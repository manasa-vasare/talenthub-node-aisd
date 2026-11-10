import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { JWTPayload, UserRole } from '../types/index.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Validates JWT in the Authorization header: Bearer <token>
 * Enforces NFR-3.1 & NFR-3.7
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Missing token.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Session expired. Please log in again.' });
      return;
    }
    res.status(403).json({ error: 'Invalid or forged authentication token.' });
    return;
  }
}

/**
 * Enforces server-side role authorization (Student, Company, Coordinator).
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
}

/**
 * Enforces company boundary isolation:
 * Company rep can only access resources belonging to their company (FR-1.4).
 */
export function enforceCompanyScope(req: Request, res: Response, companyId: number): boolean {
  if (!req.user) return false;
  if (req.user.role === 'coordinator') return true; // Coordinator has universal access (FR-1.5)
  if (req.user.role === 'company' && req.user.companyId === companyId) return true;
  return false;
}

