import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    type: { type: String, enum: ["automation", "email", "template", "gmail", "n8n"], default: "email" },
    title: { type: String, required: true },
    detail: { type: String, default: "" }
  },
  { timestamps: true }
);

export const Activity = mongoose.model("Activity", activitySchema);
