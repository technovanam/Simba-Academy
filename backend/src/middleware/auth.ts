import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/database.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.js";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware to authenticate requests via JWT.
 * Also checks if the user account is still active.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new UnauthorizedError("Missing or invalid token"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isActive: true },
    });

    if (!user) {
      return next(new UnauthorizedError("User no longer exists"));
    }

    if (!user.isActive) {
      return next(new ForbiddenError("Your account has been deactivated"));
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

/**
 * Middleware to optionally authenticate requests.
 * If a valid token is provided, req.user is set.
 * If no token or invalid token, the request still proceeds.
 */
export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { isActive: true },
      });

      if (user && user.isActive) {
        req.user = decoded;
      }
    }
    next();
  } catch {
    // Silently ignore errors for optional authentication
    next();
  }
}

/**
 * Middleware to authorize requests based on user roles.
 */
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(new ForbiddenError("Insufficient permissions"));
    }
    next();
  };
}
