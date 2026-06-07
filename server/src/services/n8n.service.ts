import fs from "fs";
import path from "path";
import { env } from "../config/env.js";

export async function createClientWorkflow(client: { id: string; name: string }) {
  if (!env.n8nApiKey) {
    return {
      status: "skipped",
      message: "N8N_API_KEY is not configured. Import workflows/mailfast.workflow.json manually."
    };
  }

  const workflowPath = path.resolve(process.cwd(), "../workflows/mailfast.workflow.json");
  const workflow = JSON.parse(fs.readFileSync(workflowPath, "utf8"));
  workflow.name = `mailfast - ${client.name}`;
  workflow.active = false;

  const webhook = workflow.nodes.find((node: any) => node.name === "Client Inbound Webhook");
  if (webhook) {
    webhook.parameters.path = `mailfast/${client.id}/inbound`;
    webhook.webhookId = client.id;
  }

  const response = await fetch(`${env.n8nBaseUrl.replace(/\/$/, "")}/api/v1/workflows`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-N8N-API-KEY": env.n8nApiKey
    },
    body: JSON.stringify(workflow)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { status: "failed", message: payload.message || `n8n returned HTTP ${response.status}` };
  }
  return { status: "created", workflowId: payload.id, message: "Workflow created in local n8n. Connect credentials and activate it." };
}
