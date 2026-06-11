import { Router } from "express";
import { Client } from "../models/Client.js";
import { Email } from "../models/Email.js";
import { Activity } from "../models/Activity.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const userRouter = Router();

// All user routes require auth (any role)
userRouter.use(requireAuth);

/**
 * Get the logged-in user's profile + linked client info.
 */
userRouter.get("/profile", asyncHandler(async (req: AuthRequest, res) => {
  res.json({
    user: {
      id: req.user?.id,
      email: req.user?.email,
      role: req.user?.role
    }
  });
}));

/**
 * Get emails for the logged-in user's linked client.
 * Users are matched by their email address to a client's gmail field.
 */
userRouter.get("/emails", asyncHandler(async (req: AuthRequest, res) => {
  const client = await Client.findOne({ gmail: req.user?.email });
  if (!client) {
    return res.json({ emails: [], client: null, message: "No automation linked to this account yet." });
  }
  const emails = await Email.find({ clientId: client._id }).sort({ receivedAt: -1 });
  res.json({ emails, client });
}));

/**
 * Get activity history for the logged-in user's linked client.
 */
userRouter.get("/activity", asyncHandler(async (req: AuthRequest, res) => {
  const client = await Client.findOne({ gmail: req.user?.email });
  if (!client) {
    return res.json({ activities: [], client: null });
  }
  const activities = await Activity.find({ clientId: client._id }).sort({ createdAt: -1 });
  res.json({ activities, client });
}));
