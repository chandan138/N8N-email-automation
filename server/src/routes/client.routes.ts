import { Router } from "express";
import { z } from "zod";
import { Client } from "../models/Client.js";
import { Email } from "../models/Email.js";
import { Activity } from "../models/Activity.js";
import { Template } from "../models/Template.js";
import { User } from "../models/User.js";
import { createClientWorkflow, deleteWorkflow, deleteCredential } from "../services/n8n.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdmin } from "../middleware/auth.js";

export const clientRouter = Router();

const clientSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(5),
  company: z.string().optional(),
  gmail: z.string().email(),
  tone: z.string().optional(),
  notes: z.string().optional()
});

// All client routes require admin
clientRouter.use(requireAdmin);

clientRouter.get("/", asyncHandler(async (_req, res) => {
  const clients = await Client.find().sort({ createdAt: -1 });
  res.json({ clients });
}));

clientRouter.post("/", asyncHandler(async (req, res) => {
  const input = clientSchema.parse(req.body);
  const client = await Client.create({
    name: input.name,
    phone: input.phone,
    company: input.company,
    gmail: input.gmail,
    tone: input.tone,
    notes: input.notes,
    status: "automation pending"
  });

  const n8n = await createClientWorkflow({ id: client.id as string, name: client.name, tone: client.tone, notes: client.notes, gmail: client.gmail }).catch(error => ({
    status: "failed",
    message: error.message
  }));

  if ((n8n as any).status === "created") {
    client.status = "workflow created";
    client.n8nWorkflowId = (n8n as any).workflowId;
    await client.save();
  } else {
    client.status = "workflow ready";
    await client.save();
  }

  await Activity.create({
    clientId: client._id,
    type: "automation",
    title: "Client automation configured",
    detail: (n8n as any).message
  });

  res.status(201).json({ client, n8n });
}));

clientRouter.get("/:id", asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: "Client not found." });
  const [emails, activities, templates] = await Promise.all([
    Email.find({ clientId: client._id }).sort({ receivedAt: -1 }),
    Activity.find({ clientId: client._id }).sort({ createdAt: -1 }),
    Template.find({ $or: [{ clientId: client._id }, { clientId: null }] }).sort({ createdAt: -1 })
  ]);
  res.json({ client, emails, activities, templates });
}));

clientRouter.delete("/:id", asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: "Client not found." });

  // Delete n8n workflow
  if (client.n8nWorkflowId) {
    await deleteWorkflow(client.n8nWorkflowId).catch(err =>
      console.warn(`Failed to delete n8n workflow ${client.n8nWorkflowId}:`, err.message)
    );
  }

  // Delete n8n credential
  if (client.n8nCredentialId) {
    await deleteCredential(client.n8nCredentialId).catch(err =>
      console.warn(`Failed to delete n8n credential ${client.n8nCredentialId}:`, err.message)
    );
  }

  // Delete all associated data
  await Promise.all([
    Email.deleteMany({ clientId: client._id }),
    Activity.deleteMany({ clientId: client._id }),
    Template.deleteMany({ clientId: client._id }),
    User.updateMany({ clientId: client._id }, { $set: { clientId: null } })
  ]);

  await client.deleteOne();

  res.json({ message: "Client and all associated data deleted successfully." });
}));
