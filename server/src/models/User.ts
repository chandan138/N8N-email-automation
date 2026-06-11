import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", default: null }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
