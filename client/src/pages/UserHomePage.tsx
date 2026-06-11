import { useNavigate } from "react-router-dom";
import { Mail, Zap, Shield, BarChart2, ArrowRight } from "lucide-react";

const features = [
  { icon: <Mail size={24} />, title: "Smart Email Replies", desc: "AI reads your incoming emails and drafts professional replies instantly using your personal tone." },
  { icon: <Zap size={24} />, title: "n8n Powered Automation", desc: "Every client gets a dedicated n8n workflow that connects Gmail, Gemini AI, and your dashboard." },
  { icon: <Shield size={24} />, title: "Private & Secure", desc: "Your Gmail tokens are encrypted. Only you and the admin have access to your automation data." },
  { icon: <BarChart2 size={24} />, title: "Communication Dashboard", desc: "See all incoming emails paired with AI replies in a clean, searchable dashboard." }
];

export function UserHomePage() {
  const navigate = useNavigate();

  return (
    <div className="user-home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">Powered by n8n · Gemini AI · Gmail API</div>
          <h1 className="hero-title">Your inbox,<br />automated with AI</h1>
          <p className="hero-sub">
            MailFast AI connects your Gmail to an intelligent n8n workflow that reads incoming emails,
            generates professional AI replies, sends them automatically, and logs everything in your personal dashboard.
          </p>
          <div className="hero-cta">
            <button onClick={() => navigate("/inbox")} className="btn-hero-primary">
              Open my inbox <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate("/dashboard")} className="btn-hero-secondary">
              View dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <h2 className="section-title">Everything you need</h2>
        <div className="features-grid">
          {features.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="how-section">
        <h2 className="section-title">How it works</h2>
        <div className="steps-row">
          {[
            { step: "01", label: "Admin adds you", desc: "Admin creates your client profile and links it to your Gmail." },
            { step: "02", label: "Gmail connects", desc: "You authorize Gmail OAuth and your dedicated workflow activates automatically." },
            { step: "03", label: "Emails arrive", desc: "n8n polls your Gmail for new messages in real time." },
            { step: "04", label: "AI replies", desc: "Gemini AI drafts a reply in your tone and sends it. Your dashboard updates instantly." }
          ].map(s => (
            <div key={s.step} className="step-card">
              <div className="step-number">{s.step}</div>
              <div className="step-label">{s.label}</div>
              <p className="step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2 className="cta-title">Ready to automate your inbox?</h2>
        <p className="cta-sub">View your subscription plan or go straight to your dashboard.</p>
        <div className="hero-cta">
          <button onClick={() => navigate("/plans")} className="btn-hero-primary">See plans <ArrowRight size={18} /></button>
          <button onClick={() => navigate("/dashboard")} className="btn-hero-secondary">My dashboard</button>
        </div>
      </section>
    </div>
  );
}
