import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const authRouter = Router();

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "user"]).default("user")
});

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "user"]).optional()
});

function sign(user: { id: string; name: string; email: string; role: string }) {
  return {
    token: jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: "7d" }
    ),
    user
  };
}

authRouter.post("/signup", asyncHandler(async (req, res) => {
  const input = signupSchema.parse(req.body);

  // Only allow admin signup if the request comes with an admin secret or there are no admins yet
  if (input.role === "admin") {
    const adminExists = await User.findOne({ role: "admin" });
    if (adminExists) {
      return res.status(403).json({ message: "Admin account already exists. Contact the administrator." });
    }
  }

  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) return res.status(409).json({ message: "Account already exists." });

  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: await bcrypt.hash(input.password, 10),
    role: input.role
  });

  res.status(201).json(sign({ id: user.id, name: user.name, email: user.email, role: user.role }));
}));

authRouter.post("/signin", asyncHandler(async (req, res) => {
  const input = signinSchema.parse(req.body);
  const user = await User.findOne({ email: input.email.toLowerCase() });

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  // If role is specified in signin, verify it matches the user's actual role
  if (input.role && user.role !== input.role) {
    return res.status(403).json({
      message: `This account is registered as "${user.role}", not "${input.role}". Please select the correct role.`
    });
  }

  res.json(sign({ id: user.id, name: user.name, email: user.email, role: user.role }));
}));
