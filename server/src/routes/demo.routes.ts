import { Router } from "express";
import { Client } from "../models/Client.js";
import { Email } from "../models/Email.js";
import { Activity } from "../models/Activity.js";
import { generateAiReply } from "../services/ai.service.js";

export const demoRouter = Router();

demoRouter.post("/incoming", async (req, res) => {
  const client = await Client.findById(req.body.clientId);
  if (!client) return res.status(404).json({ message: "Client not found." });
  const sender = `lead${Math.floor(Math.random() * 90) + 10}@example.com`;
  const subject = "Question about automation setup";
  const snippet = "Can you explain how the AI email automation will handle unread Gmail messages and follow-ups?";
  const aiReply = await generateAiReply({
    clientName: client.name,
    tone: client.tone,
    notes: client.notes,
    from: sender,
    subject,
    snippet
  });
  const email = await Email.create({
    clientId: client._id,
    from: sender,
    subject,
    snippet,
    aiReply,
    priority: req.body.priority || "normal",
    status: "replied"
  });
  await Activity.create({ clientId: client._id, type: "email", title: `Demo incoming email processed for ${sender}`, detail: subject });
  res.status(201).json({ email });
});
