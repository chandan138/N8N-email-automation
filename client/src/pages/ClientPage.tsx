import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Wifi, WifiOff } from "lucide-react";
import { Activity, api, Client, EmailItem, Template, getGmailOAuthUrl } from "../services/api";

type Tab = "communication" | "tracking" | "templates" | "activity";

export function ClientPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [client, setClient] = useState<Client | null>(null);
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tab, setTab] = useState<Tab>("communication");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");
  const [error, setError] = useState("");
  const [gmailMsg, setGmailMsg] = useState("");
  const [connectingGmail, setConnectingGmail] = useState(false);

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
    // Check for Gmail OAuth redirect
    if (searchParams.get("gmailConnected")) {
      setGmailMsg("Gmail connected and workflow activated successfully!");
    }
    return () => clearInterval(timer);
  }, [load, searchParams]);

  const filtered = useMemo(() => emails.filter(email => {
    const text = `${email.from} ${email.subject} ${email.snippet} ${email.aiReply}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (priority === "all" || email.priority === priority);
  }), [emails, search, priority]);

  async function handleConnectGmail() {
    if (!client) return;
    setConnectingGmail(true);
    try {
      const { data } = await getGmailOAuthUrl(client._id);
      window.open(data.url, "_blank", "width=600,height=700");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to get Gmail OAuth URL.");
    } finally {
      setConnectingGmail(false);
    }
  }

  async function addTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    await api.post("/templates", body);
    event.currentTarget.reset();
    await load();
  }

  if (error) return (
    <main className="admin-main">
      <div className="alert alert-error">{error}</div>
    </main>
  );
  if (!client) return <main className="admin-main"><div className="empty-state">Loading client…</div></main>;

  return (
    <main className="admin-main">
      {/* Client header */}
      <section className="panel client-header-panel">
        <div className="client-header-top">
          <Link to="/admin" className="btn-outline-sm"><ArrowLeft size={15} /> Dashboard</Link>
          <div className="client-header-badges">
            {client.n8nWorkflowId ? (
              <button 
                onClick={(e) => { e.preventDefault(); window.open(`http://localhost:5678/workflow/${client.n8nWorkflowId}`, '_blank'); }}
                className={`status-badge clickable ${client.status.replace(/\s+/g, "-")}`}
                title="Open n8n workflow"
              >
                {client.status} <ExternalLink size={10} style={{ marginLeft: 4, display: 'inline' }} />
              </button>
            ) : (
              <span className={`status-badge ${client.status.replace(/\s+/g, "-")}`}>{client.status}</span>
            )}
            {client.gmailConnected
              ? <span className="gmail-badge connected"><Wifi size={13} /> Gmail connected</span>
              : (
                <button
                  onClick={handleConnectGmail}
                  disabled={connectingGmail}
                  className="gmail-badge disconnected clickable"
                >
                  <WifiOff size={13} /> {connectingGmail ? "Opening…" : "Connect Gmail"}
                  <ExternalLink size={12} />
                </button>
              )
            }
          </div>
        </div>
        <h1 className="client-page-name">{client.name}</h1>
        <p className="client-page-meta">{client.company} · {client.gmail}{client.phone ? ` · ${client.phone}` : ""}</p>
        {gmailMsg && <div className="alert alert-success" style={{ marginTop: 12 }}>{gmailMsg}</div>}
      </section>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card"><strong className="stat-value">{emails.filter(e => e.status === "replied").length}</strong><div className="stat-label">AI replies sent</div></div>
        <div className="stat-card"><strong className="stat-value">{emails.filter(e => e.priority === "high").length}</strong><div className="stat-label">High priority</div></div>
        <div className="stat-card"><strong className="stat-value">{templates.length}</strong><div className="stat-label">Templates</div></div>
        <div className="stat-card"><strong className="stat-value">{activities.length}</strong><div className="stat-label">Activity events</div></div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {(["communication", "tracking", "templates", "activity"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`tab-btn${tab === t ? " active" : ""}`}>{t}</button>
        ))}
      </div>

      {/* Communication & Tracking */}
      {(tab === "communication" || tab === "tracking") && (
        <div className="two-col">
          <section className="panel">
            <h2 className="panel-title">{tab === "tracking" ? "Email tracking" : "Incoming emails"}</h2>
            <div className="filter-row">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search emails…" className="form-input" />
              <select value={priority} onChange={e => setPriority(e.target.value)} className="form-input" style={{ maxWidth: 150 }}>
                <option value="all">All priority</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="email-list">
              {filtered.map(email => <EmailCard key={email._id} email={email} />)}
              {!filtered.length && (
                <div className="empty-state">
                  {client.gmailConnected
                    ? "No emails yet. Emails will appear here when n8n processes them."
                    : "Connect Gmail to start receiving emails in this dashboard."}
                </div>
              )}
            </div>
          </section>
          <section className="panel">
            <h2 className="panel-title">AI generated replies</h2>
            <div className="reply-list">
              {filtered.map(email => (
                <article key={email._id} className="reply-item">
                  <div className="reply-subject">{email.subject}</div>
                  <div className="reply-from">↩ To: {email.from}</div>
                  <p className="reply-body">{email.aiReply}</p>
                </article>
              ))}
              {!filtered.length && <div className="empty-state">AI replies will appear here once emails are processed.</div>}
            </div>
          </section>
        </div>
      )}

      {/* Templates */}
      {tab === "templates" && (
        <div className="two-col">
          <section className="panel">
            <h2 className="panel-title">Reply templates</h2>
            <div className="template-list">
              {templates.map(t => (
                <article key={t._id} className="template-card">
                  <strong>{t.name}</strong>
                  <div className="template-subject">{t.subject}</div>
                  <p className="template-body">{t.body}</p>
                </article>
              ))}
              {!templates.length && <div className="empty-state">No templates yet.</div>}
            </div>
          </section>
          <section className="panel">
            <h2 className="panel-title">Add template</h2>
            <form onSubmit={addTemplate} className="modal-form">
              <input type="hidden" name="clientId" value={client._id} />
              <input name="name" required placeholder="Template name" className="form-input" />
              <input name="subject" required placeholder="Re: {{subject}}" className="form-input" />
              <textarea name="body" required placeholder="Hi {{senderName}}, …" className="form-textarea" />
              <button className="btn-primary">Add template</button>
            </form>
          </section>
        </div>
      )}

      {/* Activity — email log pairs */}
      {tab === "activity" && (
        <section className="panel">
          <h2 className="panel-title">Email history</h2>
          <div className="activity-list">
            {emails.map(email => (
              <article key={email._id} className="activity-email-pair">
                <div className="activity-incoming">
                  <div className="activity-pair-label">📩 Incoming</div>
                  <div className="activity-pair-meta">{email.from} · {new Date(email.receivedAt).toLocaleString()}</div>
                  <div className="activity-pair-subject">{email.subject}</div>
                  <p className="activity-pair-body">{email.snippet}</p>
                  <span className={`priority-badge ${email.priority}`}>{email.priority}</span>
                </div>
                <div className="activity-reply">
                  <div className="activity-pair-label">🤖 AI Reply</div>
                  <p className="activity-pair-body">{email.aiReply}</p>
                </div>
              </article>
            ))}
            {!emails.length && (
              <div className="empty-state">
                {client.gmailConnected
                  ? "No email history yet."
                  : "Connect Gmail to start tracking email conversations."}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

function EmailCard({ email }: { email: EmailItem }) {
  return (
    <article className="email-card">
      <div className="email-card-meta">
        <span className="email-from">{email.from}</span>
        <span className="email-date">{new Date(email.receivedAt).toLocaleString()}</span>
      </div>
      <strong className="email-subject">{email.subject}</strong>
      <p className="email-snippet">{email.snippet}</p>
      <div className="email-card-footer">
        <span className={`priority-badge ${email.priority}`}>{email.priority}</span>
        <span className="status-pill">{email.status}</span>
      </div>
    </article>
  );
}
