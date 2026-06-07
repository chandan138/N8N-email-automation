import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.SERVER_PORT || 5000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mailfast_ai",
  jwtSecret: process.env.JWT_SECRET || "mailfast_dev_secret",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  aiProvider: process.env.AI_PROVIDER || "gemini",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  n8nBaseUrl: process.env.N8N_BASE_URL || "http://localhost:5678",
  n8nApiKey: process.env.N8N_API_KEY || "",
  mailfastAppUrl: process.env.MAILFAST_APP_URL || "http://localhost:5000",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/gmail/oauth/callback"
};
