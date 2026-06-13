import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Client } from "../models/Client.js";
import { Email } from "../models/Email.js";
import { Activity } from "../models/Activity.js";
import { generateAiReply } from "../services/ai.service.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const n8nRouter = Router();

/**
 * Basic API key guard for the n8n webhook endpoint (#8).
 * If N8N_API_KEY is configured, incoming requests must include
 * it in the x-api-key header. When no key is set (dev mode),
 * the endpoint remains open for easy local testing.
 */
function requireN8nApiKey(req: Request, res: Response, next: NextFunction) {
  if (env.n8nApiKey && req.headers["x-api-key"] !== env.n8nApiKey) {
    return res.status(401).json({ message: "Invalid or missing x-api-key header." });
  }
  next();
}

const incomingSchema = z.object({
  clientId: z.string().optional(),
  clientGmail: z.string().email().optional(),
  from: z.string().default("unknown sender"),
  subject: z.string().default("(no subject)"),
  snippet: z.string().default(""),
  input: z.string().optional(),
  aiReply: z.string().optional(),
  reply: z.string().optional(),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  status: z.enum(["received", "suggested", "replied", "failed"]).default("replied")
});

n8nRouter.post("/incoming", requireN8nApiKey, asyncHandler(async (req, res) => {
  const input = incomingSchema.parse(req.body);
  let client = input.clientId
    ? await Client.findById(input.clientId)
    : await Client.findOne({ gmail: input.clientGmail?.toLowerCase() });

  // Removed dangerous fallback that assigned emails to the first client in the database
  // when the n8n payload had missing identifiers.

  if (!client) return res.status(404).json({ message: "Client not found for n8n payload." });

  const aiReply = input.aiReply || input.reply || await generateAiReply({
    clientName: client.name,
    tone: client.tone,
    notes: client.notes,
    from: input.from,
    subject: input.subject,
    snippet: input.snippet
  });

  const email = await Email.create({
    clientId: client._id,
    from: input.from,
    subject: input.subject,
    snippet: input.snippet,
    input: input.input,
    aiReply,
    priority: input.priority,
    status: input.status
  });
  await Activity.create({
    clientId: client._id,
    type: "email",
    title: `AI reply generated for ${input.from}`,
    detail: input.subject
  });
  res.status(201).json({ ok: true, email });
}));
