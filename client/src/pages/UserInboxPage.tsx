import { useCallback, useEffect, useMemo, useState } from "react";
import { getUserEmails, EmailItem, Client } from "../services/api";

export function UserInboxPage() {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [selected, setSelected] = useState<EmailItem | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await getUserEmails();
      setEmails(data.emails);
      setClient(data.client);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load emails.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 8000);
    return () => clearInterval(timer);
  }, [load]);

  const filtered = useMemo(() =>
    emails.filter(e =>
      `${e.from} ${e.subject} ${e.snippet}`.toLowerCase().includes(search.toLowerCase())
    ), [emails, search]);

  if (loading) return <div className="user-page"><div className="empty-state">Loading inbox…</div></div>;

  if (!client) return (
    <div className="user-page">
      <div className="no-client-notice">
        <div className="no-client-icon">📭</div>
        <h2>No automation linked yet</h2>
        <p>Your account hasn't been linked to a Gmail automation yet. Contact the admin to get set up.</p>
      </div>
    </div>
  );

  return (
    <div className="inbox-page">
      {/* Sidebar */}
      <aside className="inbox-sidebar">
        <div className="inbox-sidebar-header">
          <h2 className="inbox-title">Inbox</h2>
          <span className="inbox-count">{emails.length}</span>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search emails…"
          className="inbox-search"
        />
        {error && <div className="alert alert-error" style={{ margin: "8px 0" }}>{error}</div>}
        <div className="inbox-list">
          {filtered.map(email => (
            <button
              key={email._id}
              onClick={() => setSelected(email)}
              className={`inbox-item${selected?._id === email._id ? " active" : ""}`}
            >
              <div className="inbox-item-from">{email.from}</div>
              <div className="inbox-item-subject">{email.subject}</div>
              <div className="inbox-item-snippet">{email.snippet.slice(0, 80)}…</div>
              <div className="inbox-item-footer">
                <span className={`priority-badge ${email.priority}`}>{email.priority}</span>
                <span className="inbox-item-date">{new Date(email.receivedAt).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
          {!filtered.length && (
            <div className="empty-state">
              {search ? "No emails match your search." : "No emails yet. They will appear here once your automation processes them."}
            </div>
          )}
        </div>
      </aside>

      {/* Detail pane */}
      <main className="inbox-detail">
        {selected ? (
          <article className="email-detail">
            <header className="email-detail-header">
              <h2 className="email-detail-subject">{selected.subject}</h2>
              <div className="email-detail-meta">
                <span>From: {selected.from}</span>
                <span>{new Date(selected.receivedAt).toLocaleString()}</span>
                <span className={`priority-badge ${selected.priority}`}>{selected.priority}</span>
              </div>
            </header>
            <section className="email-detail-body">
              <div className="email-section-label">📩 Original email</div>
              <div className="email-snippet-box">{selected.snippet}</div>
              {selected.input && (
                <div style={{marginTop: 12}}>
                  <div className="email-section-label">⚙️ Input</div>
                  <div className="email-snippet-box" style={{backgroundColor: 'rgba(0,0,0,0.03)'}}>{selected.input}</div>
                </div>
              )}
            </section>
            <section className="email-detail-reply">
              <div className="email-section-label">🤖 AI generated reply (sent automatically)</div>
              <div className="email-reply-box">{selected.aiReply}</div>
            </section>
          </article>
        ) : (
          <div className="inbox-placeholder">
            <div className="inbox-placeholder-icon">✉️</div>
            <p>Select an email to read it</p>
          </div>
        )}
      </main>
    </div>
  );
}
