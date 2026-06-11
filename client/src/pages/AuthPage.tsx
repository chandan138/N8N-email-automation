import { FormEvent, useState } from "react";
import { api, setSession, User } from "../services/api";

export function AuthPage({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const { data } = await api.post(`/auth/${mode}`, body);
      setSession(data.token, data.user);
      onAuth(data.user);
    } catch (err: any) {
      if (err.code === "ERR_NETWORK") {
        setError("Backend server is not reachable. Make sure npm run dev is running and MongoDB is started.");
        return;
      }
      setError(err.response?.data?.message || "Authentication failed. Check the server terminal for details.");
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex min-h-[420px] flex-col justify-between bg-[linear-gradient(rgba(12,73,70,.62),rgba(12,73,70,.82)),url('https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center p-8 text-white lg:p-14">
        <div>
          <div className="grid h-12 w-12 place-items-center rounded-lg border border-white/30 bg-white/15 font-black">MF</div>
          <h1 className="mt-8 text-5xl font-black leading-none md:text-6xl">MailFast AI</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">Automate client inboxes with AI replies, Gmail workflows, MongoDB conversation history, templates, notifications, and n8n orchestration.</p>
        </div>
        {/* <div className="grid gap-3 sm:grid-cols-3">
          {["", "MongoDB", "n8n + Gmail"].map(item => <div key={item} className="rounded-lg border border-white/25 bg-white/15 p-4 font-bold">{item}</div>)}
        </div> */}
      </section>
      <section className="grid place-items-center p-6">
        <div className="w-[min(460px,100%)] rounded-lg border border-slate-200 bg-white p-7 shadow-soft">
          <h2 className="text-2xl font-black">{mode === "signin" ? "Sign in" : "Create account"}</h2>
          <p className="mt-2 text-slate-500">{mode === "signin" ? "Use the seeded admin account or create your own." : "Create a workspace account for client automations."}</p>
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button onClick={() => setMode("signin")} className={`min-h-10 rounded-md font-semibold ${mode === "signin" ? "bg-white shadow-sm" : "text-slate-500"}`}>Sign in</button>
            <button onClick={() => setMode("signup")} className={`min-h-10 rounded-md font-semibold ${mode === "signup" ? "bg-white shadow-sm" : "text-slate-500"}`}>Sign up</button>
          </div>
          <form onSubmit={submit} className="mt-6 grid gap-4">
            {mode === "signup" && <input name="name" required placeholder="Name" className="min-h-11 rounded-lg border border-slate-200 px-3 outline-brand" />}
            <input name="email" type="email" required defaultValue={mode === "signin" ? "admin@mailfast.local" : ""} placeholder="Email" className="min-h-11 rounded-lg border border-slate-200 px-3 outline-brand" />
            <input name="password" type="password" required defaultValue={mode === "signin" ? "demo123" : ""} placeholder="Password" className="min-h-11 rounded-lg border border-slate-200 px-3 outline-brand" />
            <button className="min-h-11 rounded-lg bg-brand px-4 font-bold text-white">{mode === "signin" ? "Sign in" : "Create account"}</button>
            <div className="min-h-5 text-sm text-red-600">{error}</div>
          </form>
        </div>
      </section>
    </main>
  );
}
