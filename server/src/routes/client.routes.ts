import { Router } from "express";
import { z } from "zod";
import { Client } from "../models/Client.js";
import { Email } from "../models/Email.js";
import { Activity } from "../models/Activity.js";
import { Template } from "../models/Template.js";
import { createClientWorkflow } from "../services/n8n.service.js";

export const clientRouter = Router();

const clientSchema = z.object({
  name: z.string().min(2),
  company: z.string().optional(),
  gmail: z.string().email(),
  tone: z.string().optional(),
  notes: z.string().optional()
});

clientRouter.get("/", async (_req, res) => {
  const clients = await Client.find().sort({ createdAt: -1 });
  res.json({ clients });
});

clientRouter.post("/", async (req, res) => {
  const input = clientSchema.parse(req.body);
  const client = await Client.create({
    name: input.name,
    company: input.company,
    gmail: input.gmail,
    tone: input.tone,
    notes: input.notes,
    status: "automation pending"
  });
  const n8n = await createClientWorkflow({ id: client.id, name: client.name }).catch(error => ({
    status: "failed",
    message: error.message
  }));
  if (n8n.status === "created") {
    client.status = "workflow created";
    client.n8nWorkflowId = (n8n as any).workflowId;
    await client.save();
  } else {
    client.status = "workflow ready";
    await client.save();
  }
  await Activity.create({ clientId: client._id, type: "automation", title: "Client automation configured", detail: n8n.message });
  res.status(201).json({ client, n8n });
});

clientRouter.get("/:id", async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: "Client not found." });
  const [emails, activities, templates] = await Promise.all([
    Email.find({ clientId: client._id }).sort({ receivedAt: -1 }),
    Activity.find({ clientId: client._id }).sort({ createdAt: -1 }),
    Template.find({ $or: [{ clientId: client._id }, { clientId: null }] }).sort({ createdAt: -1 })
  ]);
  res.json({ client, emails, activities, templates });
});
