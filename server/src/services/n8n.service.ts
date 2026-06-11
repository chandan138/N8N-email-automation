import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const N8N_BASE = env.n8nBaseUrl.replace(/\/$/, "");
const N8N_HEADERS = {
  "Content-Type": "application/json",
  "X-N8N-API-KEY": env.n8nApiKey
};

async function n8nFetch(path: string, method = "GET", body?: object) {
  const res = await fetch(`${N8N_BASE}/api/v1${path}`, {
    method,
    headers: N8N_HEADERS,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).message || `n8n API error: HTTP ${res.status}`);
  return data;
}

export interface WorkflowResult {
  status: "created" | "skipped" | "failed";
  workflowId?: string;
  message: string;
}

/**
 * Clone the template workflow for a specific client:
 * - Renames the workflow to the client name
 * - Customizes the MailBrain1 system prompt with tone/notes/name
 * - Sets the HTTP callback clientId so emails route to the right client
 * - Injects the x-api-key header into the HTTP Request node
 */
export async function createClientWorkflow(client: {
  id: string;
  name: string;
  tone: string;
  notes: string;
  gmail: string;
}): Promise<WorkflowResult> {
  if (!env.n8nApiKey) {
    return {
      status: "skipped",
      message: "N8N_API_KEY is not configured. Import the workflow manually from workflows/mailfast.workflow.json."
    };
  }

  const templatePath = path.resolve(__dirname, "../../../workflows/mailfast.workflow.json");
  const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));

  // Remove id so n8n creates a fresh workflow
  delete template.id;
  delete template.versionId;
  delete template.meta;

  // Rename for this client
  template.name = `MailFast - ${client.name}`;
  template.active = false;

  // Customize MailBrain1 system prompt
  const brainNode = template.nodes.find((n: any) => n.name === "MailBrain1");
  if (brainNode?.parameters?.options) {
    brainNode.parameters.options.systemMessage =
      `=You are MailFast AI, an email assistant replying on behalf of ${client.name}.\n` +
      `Tone: ${client.tone || "Professional and concise"}.\n` +
      `Notes: ${client.notes || "No special notes"}.\n` +
      `Rules: Be polite, professional, concise, first-person, under 200 words. ` +
      `Ask for clarification if needed. Avoid sensitive details or commitments unless provided. ` +
      `Close with: Best regards, ${client.name.split(" ")[0]}.`;
  }

  // Set the HTTP callback node to use clientId for reliable matching
  const httpNode = template.nodes.find((n: any) => n.name === "Store In MailFast Dashboard");
  if (httpNode?.parameters) {
    httpNode.parameters.jsonBody = JSON.stringify({
      clientId: client.id,
      from: `{{ $json.from || '' }}`,
      subject: `{{ $json.subject || '' }}`,
      snippet: `{{ $json.snippet || '' }}`,
      aiReply: `{{ $json.aiReply || '' }}`,
      priority: "normal",
      status: "replied"
    });
    // Update x-api-key header
    const headers = httpNode.parameters.headerParameters?.parameters || [];
    const keyHeader = headers.find((h: any) => h.name === "x-api-key");
    if (keyHeader) keyHeader.value = env.n8nApiKey;
  }

  try {
    const created = await n8nFetch("/workflows", "POST", template) as any;
    return {
      status: "created",
      workflowId: created.id,
      message: `Workflow "${template.name}" created in n8n. Connect Gmail credentials and activate it.`
    };
  } catch (err: any) {
    return { status: "failed", message: err.message };
  }
}

/**
 * Create a Gmail OAuth2 credential in n8n using tokens obtained from our OAuth flow.
 * Returns the credential ID.
 */
export async function createN8nCredential(client: {
  id: string;
  name: string;
  gmail: string;
}, tokens: {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
}): Promise<string> {
  const credential = await n8nFetch("/credentials", "POST", {
    name: `Gmail - ${client.name} (${client.gmail})`,
    type: "gmailOAuth2",
    data: {
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiryDate: tokens.expiryDate
    }
  }) as any;
  return credential.id;
}

/**
 * Update the workflow's Gmail nodes to use the newly created credential.
 */
export async function assignCredentialToWorkflow(workflowId: string, credentialId: string, credentialName: string): Promise<void> {
  const workflow = await n8nFetch(`/workflows/${workflowId}`) as any;

  // Find Gmail nodes that need credentials assigned
  const gmailNodeTypes = ["n8n-nodes-base.gmailTrigger", "n8n-nodes-base.gmail"];
  for (const node of workflow.nodes) {
    if (gmailNodeTypes.includes(node.type)) {
      node.credentials = {
        gmailOAuth2: { id: credentialId, name: credentialName }
      };
    }
  }

  await n8nFetch(`/workflows/${workflowId}`, "PUT", workflow);
}

/**
 * Activate a workflow so it starts polling Gmail.
 */
export async function activateWorkflow(workflowId: string): Promise<void> {
  await n8nFetch(`/workflows/${workflowId}/activate`, "POST");
}

/**
 * Delete a workflow from n8n.
 */
export async function deleteWorkflow(workflowId: string): Promise<void> {
  await n8nFetch(`/workflows/${workflowId}`, "DELETE");
}

/**
 * Delete a credential from n8n.
 */
export async function deleteCredential(credentialId: string): Promise<void> {
  await n8nFetch(`/credentials/${credentialId}`, "DELETE");
}
