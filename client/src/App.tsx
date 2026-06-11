import { useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { ClientPage } from "./pages/ClientPage";
import { UserHomePage } from "./pages/UserHomePage";
import { PlansPage } from "./pages/PlansPage";
import { UserInboxPage } from "./pages/UserInboxPage";
import { UserDashboardPage } from "./pages/UserDashboardPage";
import { clearSession, getUser, User } from "./services/api";
import { LogOut, LayoutDashboard } from "lucide-react";

function AdminShell({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  return (
    <header className="shell-header">
      <div className="shell-inner">
        <div className="shell-brand">
          <div className="shell-logo">MF</div>
          <div>
            <div className="shell-title">MailFast AI <span className="shell-badge admin">Admin</span></div>
            <div className="shell-sub">n8n email automation dashboard</div>
          </div>
        </div>
        <div className="shell-actions">
          <span className="shell-user">{user.name} · {user.email}</span>
          <button onClick={onSignOut} className="btn-outline-sm"><LogOut size={15} /> Sign out</button>
        </div>
      </div>
    </header>
  );
}

function UserShell({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const navigate = useNavigate();
  return (
    <header className="shell-header">
      <div className="shell-inner">
        <div className="shell-brand">
          <div className="shell-logo">MF</div>
          <div>
            <div className="shell-title">MailFast AI <span className="shell-badge user">User</span></div>
            <div className="shell-sub">Your personal email automation</div>
          </div>
        </div>
        <nav className="user-nav">
          <button onClick={() => navigate("/")} className="nav-link">Home</button>
          <button onClick={() => navigate("/inbox")} className="nav-link">Inbox</button>
          <button onClick={() => navigate("/dashboard")} className="nav-link"><LayoutDashboard size={15} /> Dashboard</button>
          <button onClick={() => navigate("/plans")} className="nav-link">Plans</button>
        </nav>
        <div className="shell-actions">
          <span className="shell-user">{user.name}</span>
          <button onClick={onSignOut} className="btn-outline-sm"><LogOut size={15} /> Sign out</button>
        </div>
      </div>
    </header>
  );
}

function AdminLayout({ user, onSignOut }: { user: User | null; onSignOut: () => void }) {
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return (
    <>
      <AdminShell user={user} onSignOut={onSignOut} />
      <Outlet />
    </>
  );
}

function UserLayout({ user, onSignOut }: { user: User | null; onSignOut: () => void }) {
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== "user") return <Navigate to="/admin" replace />;
  return (
    <>
      <UserShell user={user} onSignOut={onSignOut} />
      <Outlet />
    </>
  );
}

export function App() {
  const [user, setUser] = useState<User | null>(() => {
    const u = getUser();
    if (u && !u.role) {
      clearSession();
      return null;
    }
    return u;
  });
  const navigate = useNavigate();

  function signOut() {
    clearSession();
    setUser(null);
    navigate("/auth");
  }

  function handleAuth(u: User) {
    setUser(u);
    if (u.role === "admin") navigate("/admin");
    else navigate("/");
  }

  useEffect(() => {
    if (user && location.pathname === "/auth") {
      navigate(user.role === "admin" ? "/admin" : "/");
    }
  }, [user, navigate]);

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage onAuth={handleAuth} />} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout user={user} onSignOut={signOut} />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="clients/:id" element={<ClientPage />} />
      </Route>

      {/* User routes */}
      <Route path="/" element={<UserLayout user={user} onSignOut={signOut} />}>
        <Route index element={<UserHomePage />} />
        <Route path="inbox" element={<UserInboxPage />} />
        <Route path="dashboard" element={<UserDashboardPage />} />
        <Route path="plans" element={<PlansPage />} />
      </Route>
    </Routes>
  );
}
