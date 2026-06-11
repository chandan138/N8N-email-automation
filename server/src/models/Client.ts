import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, default: "" },
    company: { type: String, default: "Independent client" },
    gmail: { type: String, required: true, lowercase: true, trim: true },
    tone: { type: String, default: "Professional and concise" },
    notes: { type: String, default: "" },
    status: { type: String, default: "automation pending" },
    n8nWorkflowId: { type: String, default: "" },
    n8nCredentialId: { type: String, default: "" },
    gmailConnected: { type: Boolean, default: false },
    gmailTokens: {
      accessToken: { type: String, default: "" },
      refreshToken: { type: String, default: "" },
      expiryDate: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

export const Client = mongoose.model("Client", clientSchema);
