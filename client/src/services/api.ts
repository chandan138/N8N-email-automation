import axios from "axios";

export type User = { id: string; name: string; email: string; role: "admin" | "user" };
export type Client = {
  _id: string;
  name: string;
  phone: string;
  company: string;
  gmail: string;
  tone: string;
  notes: string;
  status: string;
  n8nWorkflowId?: string;
  n8nCredentialId?: string;
  gmailConnected: boolean;
  createdAt: string;
};
export type EmailItem = {
  _id: string;
  clientId: string;
  from: string;
  subject: string;
  snippet: string;
  input?: string;
  aiReply: string;
  priority: "low" | "normal" | "high";
  status: string;
  receivedAt: string;
};
export type Activity = { _id: string; title: string; detail: string; type: string; createdAt: string };
export type Template = { _id: string; name: string; subject: string; body: string; clientId?: string | null };

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

export const deleteClient = (id: string) => api.delete(`/clients/${id}`);
export const connectGmailAppPassword = (clientId: string, email: string, appPassword: string) => 
  api.post<{ message: string, client: Client }>(`/gmail/connect/${clientId}`, { email, appPassword });
export const getUserEmails = () => api.get<{ emails: EmailItem[]; client: Client | null }>("/user/emails");
export const getUserActivity = () => api.get<{ activities: Activity[]; client: Client | null }>("/user/activity");