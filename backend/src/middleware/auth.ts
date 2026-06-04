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

    // Check if user still exists and is active. Role is read from the DB (not
    // the token) so demotions/promotions take effect immediately rather than
    // persisting in a stale token until it expires.
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { status: true, isDeleted: true, role: true, email: true },
    });

    if (!user || user.isDeleted) {
      return next(new UnauthorizedError("User no longer exists"));
    }

    if (user.status !== "ACTIVE") {
      return next(new ForbiddenError("Account is deactivated"));
    }

    req.user = { userId: decoded.userId, email: user.email, role: user.role };
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
        select: { status: true, isDeleted: true, role: true, email: true },
      });

      if (user && !user.isDeleted && user.status === "ACTIVE") {
        req.user = { userId: decoded.userId, email: user.email, role: user.role };
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
