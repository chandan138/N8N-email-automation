import { Router } from "express";
import { z } from "zod";
import { Client } from "../models/Client.js";
import { Email } from "../models/Email.js";
import { Activity } from "../models/Activity.js";
import { generateAiReply } from "../services/ai.service.js";

export const n8nRouter = Router();

const incomingSchema = z.object({
  clientId: z.string().optional(),
  clientGmail: z.string().email().optional(),
  from: z.string().default("unknown sender"),
  subject: z.string().default("(no subject)"),
  snippet: z.string().default(""),
  aiReply: z.string().optional(),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  status: z.enum(["received", "suggested", "replied", "failed"]).default("replied")
});

n8nRouter.post("/incoming", async (req, res) => {
  const input = incomingSchema.parse(req.body);
  const client = input.clientId
    ? await Client.findById(input.clientId)
    : await Client.findOne({ gmail: input.clientGmail?.toLowerCase() });

  if (!client) return res.status(404).json({ message: "Client not found for n8n payload." });

  const aiReply = input.aiReply || await generateAiReply({
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
});
