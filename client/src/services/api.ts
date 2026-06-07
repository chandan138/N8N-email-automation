import axios from "axios";

export type User = { id: string; name: string; email: string };
export type Client = {
  _id: string;
  name: string;
  company: string;
  gmail: string;
  tone: string;
  notes: string;
  status: string;
  n8nWorkflowId?: string;
  gmailConnected: boolean;
  createdAt: string;
};
export type EmailItem = {
  _id: string;
  clientId: string;
  from: string;
  subject: string;
  snippet: string;
  aiReply: string;
  priority: "low" | "normal" | "high";
  status: string;
  receivedAt: string;
};
export type Activity = { _id: string; title: string; detail: string; type: string; createdAt: string };
export type Template = { _id: string; name: string; subject: string; body: string; clientId?: string | null };

// baseURL is "/api" and backend routes are /api/auth, /api/clients etc — correct
export const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use(config => {
  const token = localStorage.getItem("mailfast:token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function setSession(token: string, user: User) {
  localStorage.setItem("mailfast:token", token);
  localStorage.setItem("mailfast:user", JSON.stringify(user));
}

export function getUser(): User | null {
  const raw = localStorage.getItem("mailfast:user");
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  localStorage.removeItem("mailfast:token");
  localStorage.removeItem("mailfast:user");
}