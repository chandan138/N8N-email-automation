import { Router } from "express";
import { z } from "zod";
import { Template } from "../models/Template.js";
import { Activity } from "../models/Activity.js";

export const templateRouter = Router();

templateRouter.post("/", async (req, res) => {
  const input = z.object({
    clientId: z.string().optional(),
    name: z.string().min(2),
    subject: z.string().min(2),
    body: z.string().min(5)
  }).parse(req.body);

  const template = await Template.create({
    clientId: input.clientId || null,
    name: input.name,
    subject: input.subject,
    body: input.body
  });

  if (input.clientId) {
    await Activity.create({ clientId: input.clientId, type: "template", title: "Reply template added", detail: input.name });
  }

  res.status(201).json({ template });
});
