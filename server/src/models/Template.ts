import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", default: null },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true }
  },
  { timestamps: true }
);

export const Template = mongoose.model("Template", templateSchema);
