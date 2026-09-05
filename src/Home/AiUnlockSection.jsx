import React from "react";

const plans = [
  {
    name: "Basic",
    badge: "Starter",
    price: "Free",
    oldPrice: "",
    subtitle: "For new learners",
    desc: "Start practicing with public rooms and basic AI help.",
    button: "Start Free",
    popular: false,
    features: [
      "Join public practice rooms",
      "Listen and speak with learners",
      "5 AI messages per day",
      "Basic conversation prompts",
      "Community support",
    ],
  },
  {
    name: "Medium",
    badge: "Most Popular",
    price: "$48",
    oldPrice: "$199",
    subtitle: "One-time payment • Lifetime access",
    desc: "Best for learners who want AI tutor, correction, and unlimited practice.",
    button: "Unlock Medium",
    popular: true,
    features: [
      "Unlimited AI conversations",
      "Real-time pronunciation scoring",
      "Instant grammar corrections",
      "Unlimited speaking practice",
      "AI interview roleplay",
      "Progress tracking",
      "Vocabulary builder",
    ],
  },
  {
    name: "Premium",
    badge: "Advanced",
    price: "$99",
    oldPrice: "$299",
    subtitle: "For serious learners",
    desc: "Advanced AI learning system with deep reports and priority features.",
    button: "Go Premium",
    popular: false,
    features: [
      "Everything in Medium",
      "Advanced accent coaching",
      "Personalized AI tutor personality",
      "Detailed speaking reports",
      "Priority AI response",
      "Private practice mode",
      "Early access to new tools",
    ],
  },
];

const trustBadges = [
  "Lifetime Access",
  "30-Day Refund",
  "Secure Payment",
  "AI Tutor 24/7",
];

const AiUnlockSection = () => {
  return (
    <section
      id="pricing"
      className="bg-[var(--color-bg)] px-4 py-16 text-[var(--color-text)] sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-primary-700)] shadow-sm">
            <RobotIcon className="h-4 w-4" />
            AI-Powered Fluency
          </div>

          <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] text-[var(--color-text)] sm:text-5xl">
            Master languages with{" "}
            <span className="bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] bg-clip-text text-transparent">
              Vaani AI
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-[var(--color-muted)] sm:text-lg">
            Practice conversations, get corrected instantly, improve your
            pronunciation, and build real speaking confidence with Luna AI.
          </p>
        </div>

        <div className="mx-auto mb-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {trustBadges.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-center text-xs font-black text-[var(--color-muted)] shadow-sm"
            >
              {item}
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-3 lg:items-stretch">
          {plans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>

        <p className="mt-10 text-center text-sm font-semibold text-[var(--color-soft)]">
          30-day money-back guarantee. No questions asked.
        </p>
      </div>
    </section>
  );
};

const PricingCard = ({ plan }) => (
  <article
    className={`relative h-full rounded-[2rem] border bg-[var(--color-surface)] p-6 shadow-sm transition-colors sm:p-7 ${
      plan.popular
        ? "border-[var(--color-primary)]"
        : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
    }`}
  >
    {plan.popular && (
      <div className="absolute right-5 top-5 rounded-full bg-[var(--color-primary)] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[var(--color-on-primary)]">
        Best Value
      </div>
    )}

    <span className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
      {plan.badge}
    </span>

    <h3 className="mt-6 text-2xl font-black tracking-tight text-[var(--color-text)]">
      {plan.name}
    </h3>

    <p className="mt-2 min-h-[48px] text-sm font-medium leading-6 text-[var(--color-muted)]">
      {plan.desc}
    </p>

    <div className="mt-7 flex items-end gap-2">
      <span className="text-5xl font-black tracking-[-0.06em] text-[var(--color-text)]">
        {plan.price}
      </span>
      {plan.oldPrice && (
        <span className="mb-2 text-lg font-bold text-[var(--color-soft)] line-through">
          {plan.oldPrice}
        </span>
      )}
    </div>

    <p className="mt-2 text-xs font-black text-[var(--color-primary-700)]">
      {plan.subtitle}
    </p>

    <button
      type="button"
      className={`mt-7 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black transition-colors ${
        plan.popular
          ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-600)]"
          : "border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] hover:border-[var(--color-border-strong)]"
      }`}
    >
      {plan.button}
      <ArrowIcon className="h-4 w-4" />
    </button>

    <ul className="mt-7 space-y-3 border-t border-[var(--color-border)] pt-6">
      {plan.features.map((feature) => (
        <FeatureRow key={feature} text={feature} />
      ))}
    </ul>
  </article>
);

const FeatureRow = ({ text }) => (
  <li className="flex items-start gap-3">
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary-700)]">
      <CheckIcon className="h-3.5 w-3.5" />
    </span>
    <span className="text-sm font-semibold leading-6 text-[var(--color-muted)]">
      {text}
    </span>
  </li>
);

const RobotIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 8H17C19.2 8 21 9.8 21 12V16C21 18.2 19.2 20 17 20H7C4.8 20 3 18.2 3 16V12C3 9.8 4.8 8 7 8Z" stroke="currentColor" strokeWidth="2" />
    <path d="M9 14H9.01M15 14H15.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M9 17H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CheckIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12.5L9.2 16.7L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12H19M13 6L19 12L13 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default AiUnlockSection;
