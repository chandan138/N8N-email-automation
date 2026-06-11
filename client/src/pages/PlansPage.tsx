import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    color: "plan-free",
    features: [
      "1 Gmail account automated",
      "Up to 50 AI replies / month",
      "Basic communication dashboard",
      "Email history (7 days)",
      "Community support"
    ],
    cta: "Get started free",
    popular: false
  },
  {
    name: "Pro",
    price: "₹499",
    period: "per month",
    color: "plan-pro",
    features: [
      "1 Gmail account automated",
      "Unlimited AI replies",
      "Full communication dashboard",
      "Email history (unlimited)",
      "Custom agent behaviour & tone",
      "Reply templates",
      "Priority support"
    ],
    cta: "Start Pro",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    color: "plan-enterprise",
    features: [
      "Multiple Gmail accounts",
      "Unlimited AI replies",
      "Dedicated n8n instance",
      "Custom AI model integration",
      "Advanced analytics",
      "Team access",
      "SLA & dedicated support"
    ],
    cta: "Contact sales",
    popular: false
  }
];

export function PlansPage() {
  return (
    <div className="plans-page">
      <div className="plans-header">
        <h1 className="plans-title">Simple, transparent pricing</h1>
        <p className="plans-sub">Choose the plan that fits your automation needs. Upgrade or cancel anytime.</p>
      </div>

      <div className="plans-grid">
        {plans.map(plan => (
          <div key={plan.name} className={`plan-card ${plan.color}${plan.popular ? " popular" : ""}`}>
            {plan.popular && <div className="popular-badge">Most popular</div>}
            <div className="plan-name">{plan.name}</div>
            <div className="plan-price">{plan.price}</div>
            <div className="plan-period">{plan.period}</div>
            <ul className="plan-features">
              {plan.features.map(f => (
                <li key={f} className="plan-feature">
                  <Check size={16} className="plan-check" /> {f}
                </li>
              ))}
            </ul>
            <button className={`plan-cta${plan.popular ? " plan-cta-primary" : ""}`}>
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="plans-note">
        All plans include Gmail OAuth integration, n8n workflow automation, and MongoDB-backed email history.
        Pricing is in INR. Enterprise plans include custom billing.
      </div>
    </div>
  );
}
