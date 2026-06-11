import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, X, MoreVertical, Trash2, Wifi, WifiOff, ExternalLink } from "lucide-react";
import { api, Client, deleteClient, getGmailOAuthUrl } from "../services/api";

export function AdminDashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [connectingGmail, setConnectingGmail] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/clients");
      setClients(data.clients);
      setError("");
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Session expired or insufficient permissions. Please sign in as admin.");
      } else if (err.code === "ERR_NETWORK") {
        setError("Backend server is not reachable. Make sure the server is running on port 5000.");
      } else {
        setError(err.response?.data?.message || "Failed to load clients.");
      }
    }
  }, []);

  useEffect(() => {
    load();
    // Check for OAuth success redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get("gmailConnected")) {
      setMessage("Gmail connected and workflow activated successfully!");
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("gmailError")) {
      setError(`Gmail OAuth error: ${params.get("gmailError")}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [load]);

  async function addClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const { data } = await api.post("/clients", body);
      setClients(prev => [data.client, ...prev]);
      setMessage(data.n8n?.message || "Client automation configured.");
      event.currentTarget.reset();
      setOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add client.");
    }
  }

  async function handleDelete(client: Client) {
    setDeleting(true);
    try {
      await deleteClient(client._id);
      setClients(prev => prev.filter(c => c._id !== client._id));
      setDeleteConfirm(null);
      setMessage(`Client "${client.name}" deleted successfully.`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete client.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleConnectGmail(client: Client) {
    setConnectingGmail(client._id);
    try {
      const { data } = await getGmailOAuthUrl(client._id);
      window.open(data.url, "_blank", "width=600,height=700");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to get Gmail OAuth URL.");
    } finally {
      setConnectingGmail(null);
    }
  }

  return (
    <main className="admin-main">
      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card"><strong className="stat-value">{clients.length}</strong><div className="stat-label">Total clients</div></div>
        <div className="stat-card"><strong className="stat-value">{clients.filter(c => c.gmailConnected).length}</strong><div className="stat-label">Gmail connected</div></div>
        <div className="stat-card"><strong className="stat-value">{clients.filter(c => c.status === "workflow active").length}</strong><div className="stat-label">Active workflows</div></div>
        <div className="stat-card"><strong className="stat-value">{clients.filter(c => !c.gmailConnected).length}</strong><div className="stat-label">Pending setup</div></div>
      </div>

      {/* Client list */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Clients</h2>
            <p className="panel-sub">{clients.length} automation{clients.length !== 1 ? "s" : ""} configured</p>
          </div>
          <button onClick={() => setOpen(true)} className="btn-primary"><Plus size={17} /> Add client</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="client-list">
          {clients.map(client => (
            <div key={client._id} className="client-card">
              <Link to={`/admin/clients/${client._id}`} className="client-card-body">
                <div className="client-info">
                  <strong className="client-name">{client.name}</strong>
                  <div className="client-meta">{client.company} · {client.gmail}</div>
                  {client.phone && <div className="client-meta">📞 {client.phone}</div>}
                </div>
                <div className="client-card-right">
                  <span className={`status-badge ${client.status.replace(/\s+/g, "-")}`}>{client.status}</span>
                  {client.gmailConnected
                    ? <span className="gmail-badge connected"><Wifi size={13} /> Gmail on</span>
                    : <span className="gmail-badge disconnected"><WifiOff size={13} /> Gmail off</span>
                  }
                </div>
              </Link>
              {/* 3-dot menu */}
              <div className="client-menu-wrap">
                <button className="dots-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === client._id ? null : client._id); }}>
                  <MoreVertical size={18} />
                </button>
                {menuOpen === client._id && (
                  <div className="dropdown-menu">
                    {!client.gmailConnected && (
                      <button
                        className="dropdown-item"
                        disabled={connectingGmail === client._id}
                        onClick={() => { setMenuOpen(null); handleConnectGmail(client); }}
                      >
                        <ExternalLink size={15} /> {connectingGmail === client._id ? "Opening…" : "Connect Gmail"}
                      </button>
                    )}
                    <button
                      className="dropdown-item danger"
                      onClick={() => { setMenuOpen(null); setDeleteConfirm(client); }}
                    >
                      <Trash2 size={15} /> Delete client
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {!clients.length && <p className="empty-state">No clients yet. Click "Add client" to get started.</p>}
        </div>
      </section>

      {/* Add Client Modal */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <section className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Add client automation</h2>
                <p className="modal-sub">Creates a MongoDB client and a dedicated n8n workflow.</p>
              </div>
              <button onClick={() => setOpen(false)} className="modal-close"><X size={18} /></button>
            </div>
            <form onSubmit={addClient} className="modal-form">
              <div className="form-row">
                <input name="name" required placeholder="Client full name" className="form-input" />
                <input name="phone" required placeholder="Phone number" className="form-input" />
              </div>
              <input name="company" placeholder="Company or project" className="form-input" />
              <input name="gmail" type="email" required placeholder="client@gmail.com (to automate)" className="form-input" />
              <select name="tone" className="form-input">
                <option>Professional and concise</option>
                <option>Warm and helpful</option>
                <option>Formal and detailed</option>
                <option>Friendly and brief</option>
              </select>
              <textarea
                name="notes"
                placeholder="Agent behaviour: sign-off name, escalation rules, sensitive topics, context…"
                className="form-textarea"
              />
              <button className="btn-primary w-full">Complete automation</button>
            </form>
          </section>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <section className="modal-card modal-card-sm" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Delete "{deleteConfirm.name}"?</h2>
            <p className="modal-sub" style={{ marginTop: 8 }}>
              This will permanently delete the client, all their emails, activities, and the n8n workflow. This cannot be undone.
            </p>
            <div className="modal-actions">
              <button onClick={() => setDeleteConfirm(null)} className="btn-outline">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting} className="btn-danger">
                {deleting ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Close dropdown on outside click */}
      {menuOpen && <div className="overlay-invisible" onClick={() => setMenuOpen(null)} />}
    </main>
  );
}
