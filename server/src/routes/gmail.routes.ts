import { Router } from "express";
import { Client } from "../models/Client.js";
import { Activity } from "../models/Activity.js";
import { getGmailAuthUrl, exchangeCodeForTokens } from "../services/gmail.service.js";
import { createN8nCredential, assignCredentialToWorkflow, activateWorkflow } from "../services/n8n.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdmin } from "../middleware/auth.js";
import { env } from "../config/env.js";

export const gmailRouter = Router();

/**
 * Generate the Gmail OAuth URL for a specific client.
 * Admin clicks this to start the OAuth flow for a client.
 */
gmailRouter.get("/oauth/url/:clientId", requireAdmin, asyncHandler(async (req, res) => {
  const clientId = req.params.clientId as string;
  const client = await Client.findById(clientId);
  if (!client) return res.status(404).json({ message: "Client not found." });
  if (!env.googleClientId || !env.googleClientSecret) {
    return res.status(503).json({
      message: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env"
    });
  }
  const url = getGmailAuthUrl(clientId);
  res.json({ url });
}));

/**
 * OAuth callback — Google redirects here after the client authorizes.
 * This endpoint:
 *  1. Exchanges the auth code for tokens
 *  2. Stores tokens on the client record
 *  3. Creates Gmail credentials in n8n
 *  4. Assigns credentials to the client's workflow
 *  5. Activates the workflow
 *  6. Redirects to the admin dashboard with a success message
 */
gmailRouter.get("/oauth/callback", asyncHandler(async (req, res) => {
  const { code, state: clientId, error } = req.query as Record<string, string>;

  if (error) {
    return res.redirect(
      `${env.clientUrl}/admin?gmailError=${encodeURIComponent(error)}`
    );
  }

  if (!code || !clientId) {
    return res.status(400).json({ message: "Missing code or state parameter." });
  }

  const client = await Client.findById(clientId);
  if (!client) return res.status(404).json({ message: "Client not found." });

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code);

  // Store tokens in our DB
  client.gmailTokens = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiryDate: tokens.expiryDate
  };
  client.gmailConnected = true;

  // Create credential in n8n if we have a workflow
  if (client.n8nWorkflowId && env.n8nApiKey) {
    try {
      const credentialId = await createN8nCredential(
        { id: client.id, name: client.name, gmail: client.gmail },
        tokens
      );
      client.n8nCredentialId = credentialId;

      // Assign credential to workflow nodes
      await assignCredentialToWorkflow(
        client.n8nWorkflowId,
        credentialId,
        `Gmail - ${client.name} (${client.gmail})`
      );

      // Activate the workflow
      await activateWorkflow(client.n8nWorkflowId);
      client.status = "workflow active";

      await Activity.create({
        clientId: client._id,
        type: "gmail",
        title: "Gmail connected and workflow activated",
        detail: `OAuth tokens stored. n8n credential created and workflow activated.`
      });
    } catch (err: any) {
      console.error("n8n credential setup failed:", err.message);
      await Activity.create({
        clientId: client._id,
        type: "gmail",
        title: "Gmail connected (manual n8n setup needed)",
        detail: err.message
      });
    }
  }

  await client.save();

  // Redirect to admin dashboard with success
  res.redirect(`${env.clientUrl}/admin/clients/${clientId}?gmailConnected=true`);
}));
