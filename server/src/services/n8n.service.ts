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

  // Remove read-only properties so n8n creates a fresh workflow
  delete template.id;
  delete template.versionId;
  delete template.meta;
  delete template.tags;
  delete template.createdAt;
  delete template.updatedAt;
  template.settings = { executionOrder: 'v1' };

  // Rename for this client
  template.name = `MailFast - ${client.name}`;
  delete template.active;

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
    // If the template uses bodyParameters (form-urlencoded/json via parameters)
    httpNode.parameters.bodyParameters = {
      parameters: [
        { name: "clientId", value: client.id },
        { name: "from", value: "={{ $json.from }}" },
        { name: "subject", value: "={{ $json.subject }}" },
        { name: "snippet", value: "={{ $json.snippet }}" },
        { name: "reply", value: "={{ $json.aiReply }}" },
        { name: "clientGmail", value: client.gmail },
        { name: "priority", value: "normal" },
        { name: "status", value: "replied" }
      ]
    };
    
    // Remove old jsonBody properties if they existed
    delete httpNode.parameters.jsonBody;
    delete httpNode.parameters.specifyBody;

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
 * Create an IMAP credential in n8n.
 */
export async function createN8nImapCredential(clientId: string, email: string, password: string): Promise<string> {
  const credential = await n8nFetch("/credentials", "POST", {
    name: `IMAP - ${email}`,
    type: "imap",
    data: {
      user: email,
      password: password,
      host: "imap.gmail.com",
      port: 993,
      secure: true
    }
  }) as any;
  return credential.id;
}

/**
 * Create an SMTP credential in n8n.
 */
export async function createN8nSmtpCredential(clientId: string, email: string, password: string): Promise<string> {
  const credential = await n8nFetch("/credentials", "POST", {
    name: `SMTP - ${email}`,
    type: "smtp",
    data: {
      user: email,
      password: password,
      host: "smtp.gmail.com",
      port: 465,
      secure: true
    }
  }) as any;
  return credential.id;
}

/**
 * Update the workflow's nodes to use the newly created credentials.
 */
export async function assignCredentialToWorkflow(workflowId: string, credentialId: string, type: "imap" | "smtp"): Promise<void> {
  const workflow = await n8nFetch(`/workflows/${workflowId}`) as any;

  if (type === "imap") {
    for (const node of workflow.nodes) {
      if (node.type === "n8n-nodes-base.emailReadImap") {
        node.credentials = { imap: { id: credentialId } };
      }
    }
  } else if (type === "smtp") {
    for (const node of workflow.nodes) {
      if (node.type === "n8n-nodes-base.emailSend") {
        node.credentials = { smtp: { id: credentialId } };
      }
    }
  }

  // Only send the fields that n8n allows for updates
  const updatePayload = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings
  };

  await n8nFetch(`/workflows/${workflowId}`, "PUT", updatePayload);
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
