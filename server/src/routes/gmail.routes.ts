import { Router } from "express";
import { z } from "zod";
import { Client } from "../models/Client.js";
import { requireAdmin } from "../middleware/auth.js";
import { createN8nImapCredential, createN8nSmtpCredential, assignCredentialToWorkflow, activateWorkflow } from "../services/n8n.service.js";

export const gmailRouter = Router();

const connectSchema = z.object({
  email: z.string().email(),
  appPassword: z.string().min(1)
});

/**
 * Connect Gmail via App Password
 */
gmailRouter.post("/connect/:clientId", requireAdmin, async (req, res) => {
  try {
    const input = connectSchema.parse(req.body);
    const clientId = req.params.clientId;
    const client = await Client.findById(clientId);
    
    if (!client) return res.status(404).json({ message: "Client not found." });
    if (!client.n8nWorkflowId) {
      return res.status(400).json({ message: "Workflow not created yet for this client." });
    }

    // 1. Create IMAP Credential
    const imapCredId = await createN8nImapCredential(client.id, input.email, input.appPassword);
    
    // 2. Create SMTP Credential
    const smtpCredId = await createN8nSmtpCredential(client.id, input.email, input.appPassword);

    // 3. Assign to workflow (assumes nodes are named 'IMAP Email' and 'SMTP Send')
    await assignCredentialToWorkflow(client.n8nWorkflowId, imapCredId, "imap");
    await assignCredentialToWorkflow(client.n8nWorkflowId, smtpCredId, "smtp");

    // 4. Activate workflow
    await activateWorkflow(client.n8nWorkflowId);

    // 5. Update client
    client.gmailConnected = true;
    // Remove oauth tokens if they existed
    client.gmailTokens = undefined;
    await client.save();

    res.json({ message: "Gmail connected successfully via App Password.", client });
  } catch (error: any) {
    console.error("Connect Gmail error:", error.response?.data || error);
    res.status(500).json({ message: "Failed to connect Gmail. " + (error.message || "") });
  }
});
