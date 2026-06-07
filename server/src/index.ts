import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { seedDatabase } from "./utils/seed.js";
import { authRouter } from "./routes/auth.routes.js";
import { clientRouter } from "./routes/client.routes.js";
import { templateRouter } from "./routes/template.routes.js";
import { n8nRouter } from "./routes/n8n.routes.js";
import { demoRouter } from "./routes/demo.routes.js";
import { gmailRouter } from "./routes/gmail.routes.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "MailFast AI API" }));
app.use("/api/auth", authRouter);
app.use("/api/clients", requireAuth, clientRouter);
app.use("/api/templates", requireAuth, templateRouter);
app.use("/api/demo", requireAuth, demoRouter);
app.use("/api/gmail", requireAuth, gmailRouter);
app.use("/api/n8n", n8nRouter);

app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error?.issues?.[0]?.message || error.message || "Server error";
  res.status(error.status || 400).json({ message });
});

await connectDb();
await seedDatabase();

app.listen(env.port, () => {
  console.log(`MailFast AI API running at http://localhost:${env.port}`);
});
