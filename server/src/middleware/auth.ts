import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Authentication token required." });

  try {
    req.user = jwt.verify(token, env.jwtSecret) as { id: string; email: string; role: string };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Authentication token required." });

  try {
    const payload = jwt.verify(token, env.jwtSecret) as { id: string; email: string; role: string };
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required." });
    }
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
  }
}
