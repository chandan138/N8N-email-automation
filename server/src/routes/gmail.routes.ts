import { Router } from "express";
import { getGmailAuthUrl } from "../services/gmail.service.js";

export const gmailRouter = Router();

gmailRouter.get("/oauth/url", (_req, res) => {
  res.json({ url: getGmailAuthUrl() });
});

gmailRouter.get("/oauth/callback", (_req, res) => {
  res.send("Gmail OAuth callback reached. Store returned tokens securely here for production use.");
});
