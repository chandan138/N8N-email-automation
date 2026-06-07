import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Authentication token required." });

  try {
    req.user = jwt.verify(token, env.jwtSecret) as { id: string; email: string };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
  }
}
