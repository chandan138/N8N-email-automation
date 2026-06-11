import { FormEvent, useState } from "react";
import { api, setSession, User } from "../services/api";

type Role = "admin" | "user";
type Mode = "signin" | "signup";

interface Props { onAuth: (user: User) => void; }

export function AuthPage({ onAuth }: Props) {
  const [mode, setMode] = useState<Mode>("signin");
  const [role, setRole] = useState<Role>("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());

    try {
      const endpoint = mode === "signup" ? "/auth/signup" : "/auth/signin";
      const { data } = await api.post<{ token: string; user: User }>(endpoint, { ...body, role });
      setSession(data.token, data.user);
      onAuth(data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">MF</div>
          <div>
            <div className="auth-logo-title">MailFast AI</div>
            <div className="auth-logo-sub">n8n powered email automation</div>
          </div>
        </div>

        {/* Role selector */}
        <div className="auth-role-selector">
          <button
            type="button"
            className={`auth-role-btn${role === "user" ? " active" : ""}`}
            onClick={() => setRole("user")}
          >
            👤 User
          </button>
          <button
            type="button"
            className={`auth-role-btn${role === "admin" ? " active" : ""}`}
            onClick={() => setRole("admin")}
          >
            🛡️ Admin
          </button>
        </div>

        {/* Mode tabs */}
        <div className="auth-tabs">
          <button type="button" className={`auth-tab${mode === "signin" ? " active" : ""}`} onClick={() => { setMode("signin"); setError(""); }}>Sign In</button>
          <button type="button" className={`auth-tab${mode === "signup" ? " active" : ""}`} onClick={() => { setMode("signup"); setError(""); }}>Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <input name="name" required placeholder="Full name" className="auth-input" />
          )}
          <input name="email" type="email" required placeholder="Email address" className="auth-input" />
          <input name="password" type="password" required placeholder="Password" className="auth-input" />

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Please wait…" : mode === "signup" ? `Create ${role} account` : `Sign in as ${role}`}
          </button>
        </form>

        {role === "admin" && (
          <p className="auth-hint">
            Admin access is restricted. Only one admin account is allowed per instance.
          </p>
        )}

        {role === "user" && (
          <p className="auth-hint">
            Sign in to view your email automation inbox and communication dashboard.
          </p>
        )}
      </div>
    </div>
  );
}
