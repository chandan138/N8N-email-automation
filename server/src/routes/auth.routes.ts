import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { env } from "../config/env.js";

export const authRouter = Router();

const authSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(6)
});

function sign(user: { id: string; name: string; email: string }) {
  return {
    token: jwt.sign({ id: user.id, email: user.email }, env.jwtSecret, { expiresIn: "7d" }),
    user
  };
}

authRouter.post("/signup", async (req, res) => {
  const input = authSchema.extend({ name: z.string().min(2) }).parse(req.body);
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) return res.status(409).json({ message: "Account already exists." });
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: await bcrypt.hash(input.password, 10)
  });
  res.status(201).json(sign({ id: user.id, name: user.name, email: user.email }));
});

authRouter.post("/signin", async (req, res) => {
  const input = authSchema.omit({ name: true }).parse(req.body);
  const user = await User.findOne({ email: input.email.toLowerCase() });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  res.json(sign({ id: user.id, name: user.name, email: user.email }));
});
