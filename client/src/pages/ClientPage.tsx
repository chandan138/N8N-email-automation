import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MailPlus, Plus } from "lucide-react";
import { Activity, api, Client, EmailItem, Template } from "../services/api";

type Tab = "communication" | "tracking" | "templates" | "activity";

export function ClientPage() {
  const { id } = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tab, setTab] = useState<Tab>("communication");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await api.get(`/clients/${id}`);
      setClient(data.client);
      setEmails(data.emails);
      setActivities(data.activities);
      setTemplates(data.templates);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load client data.");
    }
  }, [id]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 6000);
    return () => clearInterval(timer);
  }, [load]);

  const filtered = useMemo(() => emails.filter(email => {
    const text = `${email.from} ${email.subject} ${email.snippet} ${email.aiReply}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (priority === "all" || email.priority === priority);
  }), [emails, search, priority]);

  async function simulateEmail() {
    await api.post("/demo/incoming", { clientId: id, priority: Math.random() > 0.55 ? "high" : "normal" });
    await load();
    setTab("communication");
  }

  async function addTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    await api.post("/templates", body);
    event.currentTarget.reset();
    await load();
  }

  if (error) return <main className="mx-auto w-[min(1240px,calc(100vw-32px))] py-8"><div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div></main>;
  if (!client) return <main className="mx-auto w-[min(1240px,calc(100vw-32px))] py-8">Loading client...</main>;

  return (
    <main className="mx-auto grid w-[min(1240px,calc(100vw-32px))] gap-5 py-6">
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 lg:grid-cols-[1fr_auto]">
        <div>
          <Link to="/" className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 font-semibold"><ArrowLeft size={17} /> Dashboard</Link>
          <h1 className="text-3xl font-black">{client.name}</h1>
          <p className="text-slate-500">{client.company} · {client.gmail} · {client.status}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <button onClick={simulateEmail} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 font-bold"><MailPlus size={18} /> Simulate incoming email</button>
          <span className="rounded-full bg-teal-50 px-3 py-2 text-xs font-black text-teal-800">n8n: {client.n8nWorkflowId || "import ready"}</span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="AI replies sent" value={emails.filter(item => item.status === "replied").length} />
        <Stat label="High priority emails" value={emails.filter(item => item.priority === "high").length} />
        <Stat label="Reply templates" value={templates.length} />
        <Stat label="Activity log events" value={activities.length} />
      </section>

      <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 md:grid-cols-4">
        {(["communication", "tracking", "templates", "activity"] as Tab[]).map(item => (
          <button key={item} onClick={() => setTab(item)} className={`min-h-10 rounded-md font-semibold capitalize ${tab === item ? "bg-white shadow-sm" : "text-slate-500"}`}>{item}</button>
        ))}
      </div>

      {(tab === "communication" || tab === "tracking") && (
        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-black">{tab === "tracking" ? "Email conversation tracking" : "Client communication dashboard"}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_150px]">
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search emails, senders, AI replies" className="min-h-11 rounded-lg border border-slate-200 px-3 outline-brand" />
              <select value={priority} onChange={event => setPriority(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-3 outline-brand">
                <option value="all">All priority</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="mt-4 grid gap-3">
              {filtered.map(email => <EmailCard key={email._id} email={email} />)}
              {!filtered.length && <p className="text-slate-500">No emails match the current filters.</p>}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-black">AI generated replies</h2>
            <div className="mt-4 grid gap-4">
              {filtered.map(email => (
                <article key={email._id}>
                  <strong>{email.subject}</strong>
                  <p className="mt-2 rounded-lg border border-teal-200 bg-teal-50 p-4 leading-7">{email.aiReply}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === "templates" && (
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-black">Email templates management</h2>
            <div className="mt-4 grid gap-3">
              {templates.map(template => (
                <article key={template._id} className="rounded-lg border border-slate-200 p-4">
                  <strong>{template.name}</strong>
                  <div className="text-sm text-slate-500">{template.subject}</div>
                  <p className="mt-2 leading-7 text-slate-700">{template.body}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-black">Add template</h2>
            <form onSubmit={addTemplate} className="mt-4 grid gap-4">
              <input type="hidden" name="clientId" value={client._id} />
              <input name="name" required placeholder="Template name" className="min-h-11 rounded-lg border border-slate-200 px-3 outline-brand" />
              <input name="subject" required placeholder="Re: {{subject}}" className="min-h-11 rounded-lg border border-slate-200 px-3 outline-brand" />
              <textarea name="body" required placeholder="Hi {{senderName}}, thank you..." className="min-h-28 rounded-lg border border-slate-200 p-3 outline-brand" />
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 font-bold text-white"><Plus size={18} /> Add template</button>
            </form>
          </div>
        </section>
      )}

      {tab === "activity" && (
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-black">Client activity log</h2>
          <div className="mt-4 grid gap-2">
            {activities.map(item => (
              <article key={item._id} className="grid grid-cols-[12px_1fr] gap-3 border-b border-slate-100 py-3 last:border-0">
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-blue-600" />
                <div>
                  <strong>{item.title}</strong>
                  <div className="text-sm text-slate-500">{item.detail} · {new Date(item.createdAt).toLocaleString()}</div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-5"><strong className="text-2xl">{value}</strong><div className="text-sm text-slate-500">{label}</div></div>;
}

function EmailCard({ email }: { email: EmailItem }) {
  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap justify-between gap-2 text-sm text-slate-500">
        <span>{email.from}</span>
        <span>{new Date(email.receivedAt).toLocaleString()}</span>
      </div>
      <strong className="mt-2 block">{email.subject}</strong>
      <p className="mt-2 leading-7 text-slate-600">{email.snippet}</p>
      <span className="mt-2 inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-800">{email.priority} · {email.status}</span>
    </article>
  );
}
