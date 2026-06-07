import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { api, Client } from "../services/api";

export function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const { data } = await api.get("/clients");
    setClients(data.clients);
  }

  useEffect(() => { load(); }, []);

  async function addClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    const { data } = await api.post("/clients", body);
    setClients(prev => [data.client, ...prev]);
    setMessage(data.n8n?.message || "Client automation configured.");
    event.currentTarget.reset();
    setOpen(false);
  }

  return (
    <main className="mx-auto grid w-[min(1240px,calc(100vw-32px))] gap-5 py-6 lg:grid-cols-[0.7fr_1.3fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-black">About MailFast AI</h2>
        <p className="mt-3 leading-7 text-slate-600">MailFast AI connects client Gmail inboxes to n8n workflows that filter unread messages, generate professional replies with Gemini or OpenAI, send responses with Gmail API, and store every conversation in MongoDB.</p>
        <div className="mt-5 grid gap-3 text-slate-700">
          {["AI-generated email replies", "Client communication dashboard", "Email tracking and real-time activity", "Templates, search, filters, Gmail, n8n"].map(item => (
            <div key={item} className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-amberline" />{item}</div>
          ))}
        </div>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">Existing Clients</h2>
            <p className="text-sm text-slate-500">{clients.length} client automations configured</p>
          </div>
          <button onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 font-bold text-white"><Plus size={18} /> Add client</button>
        </div>
        {message && <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{message}</div>}
        <div className="mt-5 grid gap-3">
          {clients.map(client => (
            <Link key={client._id} to={`/clients/${client._id}`} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-teal-300 hover:shadow-md sm:grid-cols-[1fr_auto]">
              <div>
                <strong>{client.name}</strong>
                <div className="text-sm text-slate-500">{client.company} · {client.gmail}</div>
                <div className="text-sm text-slate-500">Tone: {client.tone}</div>
              </div>
              <span className="self-start rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-800">{client.status}</span>
            </Link>
          ))}
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/45 p-4">
          <section className="w-[min(620px,100%)] rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Add client Gmail automation</h2>
                <p className="mt-1 text-sm text-slate-500">Creates the MongoDB client and attempts a client-specific n8n workflow when API credentials are present.</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 p-2"><X size={18} /></button>
            </div>
            <form onSubmit={addClient} className="mt-5 grid gap-4">
              <input name="name" required placeholder="Client name" className="min-h-11 rounded-lg border border-slate-200 px-3 outline-brand" />
              <input name="company" placeholder="Company or project" className="min-h-11 rounded-lg border border-slate-200 px-3 outline-brand" />
              <input name="gmail" type="email" required placeholder="client@gmail.com" className="min-h-11 rounded-lg border border-slate-200 px-3 outline-brand" />
              <select name="tone" className="min-h-11 rounded-lg border border-slate-200 px-3 outline-brand">
                <option>Professional and concise</option>
                <option>Warm and helpful</option>
                <option>Formal and detailed</option>
                <option>Friendly and brief</option>
              </select>
              <textarea name="notes" placeholder="Business context, escalation rules, sign-off name, sensitive topics." className="min-h-28 rounded-lg border border-slate-200 p-3 outline-brand" />
              <button className="min-h-11 rounded-lg bg-brand px-4 font-bold text-white">Complete automation</button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
