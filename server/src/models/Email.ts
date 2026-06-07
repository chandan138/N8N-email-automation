import mongoose from "mongoose";

const emailSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    from: { type: String, required: true },
    subject: { type: String, default: "(no subject)" },
    snippet: { type: String, default: "" },
    aiReply: { type: String, default: "" },
    priority: { type: String, enum: ["low", "normal", "high"], default: "normal" },
    status: { type: String, enum: ["received", "suggested", "replied", "failed"], default: "received" },
    receivedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Email = mongoose.model("Email", emailSchema);
