import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Client } from "../models/Client.js";
import { Email } from "../models/Email.js";
import { Activity } from "../models/Activity.js";
import { Template } from "../models/Template.js";

export async function seedDatabase() {
  await User.findOneAndUpdate(
    { email: "admin@mailfast.local" },
    {
      name: "Demo Admin",
      email: "admin@mailfast.local",
      passwordHash: await bcrypt.hash("demo123", 10)
    },
    { upsert: true, new: true }
  );

  const clients = await Client.countDocuments();
  if (!clients) {
    const chandan = await Client.create({
      name: "Chandan Kumar",
      company: "Izzki Tech",
      gmail: "chandan@example.com",
      tone: "Professional, concise, first-person replies",
      notes: "Avoid commitments unless explicitly provided. Sign off as Chandan.",
      status: "workflow ready"
    });
    const sara = await Client.create({
      name: "Sara Verma",
      company: "BrightOps Studio",
      gmail: "sara@example.com",
      tone: "Warm, direct, helpful",
      notes: "Escalate legal, pricing, and schedule commitments.",
      status: "workflow active"
    });

    await Email.create([
      {
        clientId: chandan._id,
        from: "rhea@northstar.io",
        subject: "Request for project timeline",
        snippet: "Can you share the expected timeline for the email automation dashboard?",
        aiReply: "Hi Rhea, thanks for reaching out. I can share the expected project timeline today, including setup, dashboard, n8n automation, testing, and deployment milestones. Best regards, Chandan",
        priority: "high",
        status: "replied"
      },
      {
        clientId: sara._id,
        from: "ops@clientflow.test",
        subject: "Follow-up on client inbox setup",
        snippet: "Please confirm whether Gmail OAuth is already connected.",
        aiReply: "Hi, thanks for checking in. Gmail OAuth needs to be connected before automation can be activated. Once connected, I will confirm the workflow status. Best regards, Sara",
        priority: "normal",
        status: "replied"
      }
    ]);

    await Activity.create([
      { clientId: chandan._id, type: "automation", title: "Workflow imported", detail: "mailfast template prepared for Gmail, AI, MongoDB, and dashboard callback." },
      { clientId: chandan._id, type: "email", title: "AI reply generated for rhea@northstar.io", detail: "Request for project timeline" },
      { clientId: sara._id, type: "email", title: "AI reply generated for ops@clientflow.test", detail: "Follow-up on client inbox setup" }
    ]);

    await Template.create([
      {
        name: "Acknowledgement",
        subject: "Re: {{subject}}",
        body: "Hi {{senderName}}, thank you for your message. I have received it and will get back to you if more detail is needed."
      },
      {
        name: "Clarification Request",
        subject: "Re: {{subject}}",
        body: "Hi {{senderName}}, thanks for reaching out. Could you share a little more context so I can respond accurately?"
      }
    ]);
  }
}
