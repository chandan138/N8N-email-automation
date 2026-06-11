import { useCallback, useEffect, useMemo, useState } from "react";
import { getUserEmails, EmailItem, Client } from "../services/api";

export function UserDashboardPage() {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await getUserEmails();
      setEmails(data.emails);
      setClient(data.client);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 6000);
    return () => clearInterval(timer);
  }, [load]);

  const filtered = useMemo(() => emails.filter(e => {
    const text = `${e.from} ${e.subject} ${e.snippet} ${e.aiReply}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (priority === "all" || e.priority === priority);
  }), [emails, search, priority]);

  if (loading) return <div className="user-page"><div className="empty-state">Loading dashboard…</div></div>;

  if (!client) return (
    <div className="user-page">
      <div className="no-client-notice">
        <div className="no-client-icon">🤖</div>
        <h2>No automation linked yet</h2>
        <p>Your account hasn't been linked to a Gmail automation. Contact the admin to get set up.</p>
      </div>
    </div>
  );

  return (
    <div className="user-page">
      <div className="user-page-header">
        <div>
          <h1 className="user-page-title">Communication Dashboard</h1>
          <p className="user-page-sub">{client.name} · {client.gmail}</p>
        </div>
        <div className="stats-row" style={{ gap: 12 }}>
          <div className="stat-card"><strong className="stat-value">{emails.length}</strong><div className="stat-label">Total emails</div></div>
          <div className="stat-card"><strong className="stat-value">{emails.filter(e => e.priority === "high").length}</strong><div className="stat-label">High priority</div></div>
          <div className="stat-card"><strong className="stat-value">{emails.filter(e => e.status === "replied").length}</strong><div className="stat-label">Replied</div></div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters */}
      <div className="filter-row">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search emails, AI replies…" className="form-input" />
        <select value={priority} onChange={e => setPriority(e.target.value)} className="form-input" style={{ maxWidth: 150 }}>
          <option value="all">All priority</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Email + Reply pairs */}
      <div className="comm-pairs">
        {filtered.map(email => (
          <div key={email._id} className="comm-pair">
            {/* Incoming email */}
            <div className="comm-incoming">
              <div className="comm-pair-label">📩 Incoming email</div>
              <div className="comm-pair-meta">
                <span className="email-from">{email.from}</span>
                <span className="email-date">{new Date(email.receivedAt).toLocaleString()}</span>
                <span className={`priority-badge ${email.priority}`}>{email.priority}</span>
              </div>
              <div className="comm-subject">{email.subject}</div>
              <p className="comm-body">{email.snippet}</p>
            </div>
            {/* AI Reply */}
            <div className="comm-reply">
              <div className="comm-pair-label">🤖 AI reply (auto-sent)</div>
              <p className="comm-body">{email.aiReply}</p>
            </div>
          </div>
        ))}
        {!filtered.length && (
          <div className="empty-state">
            {search || priority !== "all"
              ? "No emails match the current filters."
              : "No emails yet. Your automation will populate this once Gmail is connected."}
          </div>
        )}
      </div>
    </div>
  );
}
