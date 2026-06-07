import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    company: { type: String, default: "Independent client" },
    gmail: { type: String, required: true, lowercase: true, trim: true },
    tone: { type: String, default: "Professional and concise" },
    notes: { type: String, default: "" },
    status: { type: String, default: "automation pending" },
    n8nWorkflowId: { type: String, default: "" },
    gmailConnected: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Client = mongoose.model("Client", clientSchema);
