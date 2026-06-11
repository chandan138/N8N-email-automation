import { useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ClientPage } from "./pages/ClientPage";
import { clearSession, getUser, User } from "./services/api";
import { LogOut } from "lucide-react";

function Shell({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-16 w-[min(1240px,calc(100vw-32px))] items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand font-black text-white">MF</div>
          <div>
            <div className="font-bold">MailFast AI</div>
            <div className="text-sm text-slate-500">MERN email automation powered by n8n</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 md:inline">{user.name} · {user.email}</span>
          <button onClick={onSignOut} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 font-semibold text-slate-700">
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

function PrivateLayout({ user, onSignOut }: { user: User | null; onSignOut: () => void }) {
  if (!user) return <Navigate to="/auth" replace />;
  return (
    <>
      <Shell user={user} onSignOut={onSignOut} />
      <Outlet />
    </>
  );
}

export function App() {
  const [user, setUser] = useState<User | null>(() => getUser());
  const navigate = useNavigate();

  useEffect(() => {
    if (user && location.pathname === "/auth") navigate("/");
  }, [user, navigate]);

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage onAuth={setUser} />} />
      <Route path="/" element={<PrivateLayout user={user} onSignOut={() => { clearSession(); setUser(null); navigate("/auth"); }} />}>
        <Route index element={<DashboardPage />} />
        <Route path="clients/:id" element={<ClientPage />} />
      </Route>
    </Routes>
  );
}
