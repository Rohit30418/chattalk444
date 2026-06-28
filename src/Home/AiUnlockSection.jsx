import React from "react";
import { motion } from "framer-motion";

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
    accent: "var(--color-text)",
    accent2: "var(--color-primary)",
    accent3: "var(--color-secondary)",
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
    accent: "var(--color-primary)",
    accent2: "var(--color-secondary)",
    accent3: "var(--color-accent)",
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
    accent: "var(--color-secondary)",
    accent2: "var(--color-accent)",
    accent3: "var(--color-primary)",
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
    <section className="relative overflow-hidden bg-[var(--color-bg)] px-4 py-16 text-[var(--color-text)] transition-colors duration-300 sm:px-6 lg:px-8 lg:py-24">
      <style>{`
        .pricing-shell {
          background:
            linear-gradient(
              135deg,
              color-mix(in srgb, var(--plan-accent) 95%, transparent),
              color-mix(in srgb, var(--plan-accent-2) 92%, transparent),
              color-mix(in srgb, var(--plan-accent-3) 92%, transparent)
            );
        }

        .pricing-card-inner {
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--color-surface) 98%, transparent),
              color-mix(in srgb, var(--color-bg-lift, var(--color-bg-soft)) 42%, var(--color-surface))
            );
        }

        .pricing-glow {
          background: radial-gradient(
            circle,
            color-mix(in srgb, var(--plan-accent) 20%, transparent),
            transparent 70%
          );
        }

        .pricing-shell:hover .pricing-glow {
          opacity: 1;
          transform: scale(1.08);
        }
      `}</style>

      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-20 hidden h-80 w-80 rounded-full bg-[var(--color-primary-soft)] blur-[90px] lg:block" />
        <div className="absolute right-[-10%] bottom-20 hidden h-80 w-80 rounded-full bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] blur-[90px] lg:block" />
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-primary-700)] [box-shadow:var(--shadow-card)]">
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

        {/* Trust Badges */}
        <div className="mx-auto mb-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {trustBadges.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] px-3 py-3 text-center text-xs font-black text-[var(--color-muted)] [box-shadow:var(--shadow-card)]"
            >
              {item}
            </div>
          ))}
        </div>

        {/* Pricing Cards */}
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

const PricingCard = ({ plan }) => {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`pricing-shell relative rounded-[2rem] p-1 ${
        plan.popular
          ? "[box-shadow:var(--shadow-premium)]"
          : "border border-[var(--color-border)] bg-[var(--color-surface)] [box-shadow:var(--shadow-card)]"
      }`}
      style={{
        "--plan-accent": plan.accent,
        "--plan-accent-2": plan.accent2,
        "--plan-accent-3": plan.accent3,
      }}
    >
      <div className="pricing-glow pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-70 blur-3xl transition-all duration-300" />

      <div className="pricing-card-inner relative z-10 h-full rounded-[1.75rem] p-6 sm:p-7">
        {/* Badge */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <span
            className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${
              plan.popular
                ? "bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] text-[var(--color-on-primary)]"
                : "border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)]"
            }`}
          >
            {plan.badge}
          </span>

          {plan.popular && (
            <span className="rounded-full border border-[color-mix(in_srgb,var(--color-success)_24%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] px-3 py-1 text-xs font-black text-[var(--color-success)]">
              Best Value
            </span>
          )}
        </div>

        {/* Title */}
        <div>
          <h3 className="text-2xl font-black tracking-tight text-[var(--color-text)]">
            {plan.name}
          </h3>

          <p className="mt-2 text-sm font-medium leading-6 text-[var(--color-muted)]">
            {plan.desc}
          </p>
        </div>

        {/* Price */}
        <div className="mt-7">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black tracking-[-0.06em] text-[var(--color-text)]">
              {plan.price}
            </span>

            {plan.oldPrice && (
              <span className="mb-2 text-lg font-bold text-[var(--color-soft)] line-through decoration-[var(--color-danger)] decoration-2">
                {plan.oldPrice}
              </span>
            )}
          </div>

          <p className="mt-2 inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-black text-[var(--color-primary-700)]">
            {plan.subtitle}
          </p>
        </div>

        {/* Button */}
        <button
          type="button"
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--plan-accent)] via-[var(--plan-accent-2)] to-[var(--plan-accent-3)] px-5 py-4 text-sm font-black text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)] transition-all duration-200 hover:-translate-y-0.5"
        >
          {plan.button}
          <ArrowIcon className="h-4 w-4" />
        </button>

        {/* Features */}
        <ul className="mt-7 space-y-3 border-t border-[var(--color-border)] pt-6">
          {plan.features.map((feature) => (
            <FeatureRow key={feature} text={feature} />
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

const FeatureRow = ({ text }) => {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-success)_22%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] text-[var(--color-success)]">
        <CheckIcon className="h-3.5 w-3.5" />
      </span>

      <span className="text-sm font-semibold leading-6 text-[var(--color-muted)]">
        {text}
      </span>
    </li>
  );
};

const RobotIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 3V6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M7 8H17C19.2 8 21 9.8 21 12V16C21 18.2 19.2 20 17 20H7C4.8 20 3 18.2 3 16V12C3 9.8 4.8 8 7 8Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M9 14H9.01M15 14H15.01"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M9 17H15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const CheckIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12.5L9.2 16.7L19 7"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12H19M13 6L19 12L13 18"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default AiUnlockSection;