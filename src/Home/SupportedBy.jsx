import React from "react";

const supporters = [
  { name: "Google AI", icon: "ai" },
  { name: "OpenAI", icon: "bot" },
  { name: "Duolingo", icon: "owl" },
  { name: "Cambridge", icon: "book" },
  { name: "Coursera", icon: "cap" },
  { name: "Meta", icon: "network" },
  { name: "Microsoft", icon: "grid" },
  { name: "Notion", icon: "note" },
];

const SupportedBy = () => {
  return (
    <section className="relative overflow-hidden bg-[var(--color-surface)] px-4 py-14 text-[var(--color-text)] transition-colors duration-300 sm:px-6 lg:px-8 lg:py-20">
      <style>{`
        .support-card {
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--color-surface) 98%, transparent),
              color-mix(in srgb, var(--color-bg-lift, var(--color-bg-soft)) 45%, var(--color-surface))
            );
        }

        .support-card::before {
          content: "";
          position: absolute;
          inset: auto -54px -54px auto;
          width: 150px;
          height: 150px;
          border-radius: 999px;
          background: radial-gradient(
            circle,
            color-mix(in srgb, var(--color-primary) 14%, transparent),
            transparent 70%
          );
          filter: blur(18px);
          opacity: 0.65;
          transition: opacity 220ms ease, transform 220ms ease;
        }

        .support-card:hover::before {
          opacity: 1;
          transform: scale(1.08);
        }
      `}</style>

      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-10 hidden h-72 w-72 rounded-full bg-[var(--color-primary-soft)] blur-[90px] lg:block" />
        <div className="absolute right-[-10%] bottom-10 hidden h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] blur-[90px] lg:block" />
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-primary-soft)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-primary-700)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-success)] shadow-[0_0_0_6px_var(--color-primary-soft)]" />
            Inspired By
          </span>

          <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] text-[var(--color-text)] sm:text-4xl">
            Built with inspiration from{" "}
            <span className="bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] bg-clip-text text-transparent">
              global learning platforms
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-[var(--color-muted)]">
            Vaani is designed for modern learners who want simple, real-time,
            AI-powered speaking practice.
          </p>
        </div>

        {/* Icon Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {supporters.map((item) => (
            <div
              key={item.name}
              className="support-card group relative flex min-h-28 items-center gap-4 overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] p-5 [box-shadow:var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--color-border-strong)] hover:[box-shadow:var(--shadow-soft)]"
            >
              <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)]">
                <SupportIcon type={item.icon} className="h-6 w-6" />
              </div>

              <div className="relative z-10 min-w-0">
                <h3 className="truncate text-base font-black tracking-tight text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary-700)]">
                  {item.name}
                </h3>
                <p className="mt-1 text-xs font-bold text-[var(--color-soft)]">
                  Learning inspiration
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom proof */}
        <div className="mx-auto mt-10 max-w-3xl rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-5 text-center [box-shadow:var(--shadow-card)]">
          <p className="text-sm font-bold text-[var(--color-muted)]">
            Trusted by{" "}
            <span className="font-black text-[var(--color-primary-700)]">
              50,000+ learners
            </span>{" "}
            practicing across 25+ languages.
          </p>
        </div>
      </div>
    </section>
  );
};

const SupportIcon = ({ type, className = "" }) => {
  if (type === "ai") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M12 3L14 9L20 11L14 13L12 19L10 13L4 11L10 9L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M19 15L19.8 17.2L22 18L19.8 18.8L19 21L18.2 18.8L16 18L18.2 17.2L19 15Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "bot") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M12 3V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 8H17C19.2 8 21 9.8 21 12V16C21 18.2 19.2 20 17 20H7C4.8 20 3 18.2 3 16V12C3 9.8 4.8 8 7 8Z" stroke="currentColor" strokeWidth="2" />
        <path d="M9 14H9.01M15 14H15.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M9 17H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "owl") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M6 8C6 5.8 8 4 12 4C16 4 18 5.8 18 8V13C18 17 15.5 20 12 20C8.5 20 6 17 6 13V8Z" stroke="currentColor" strokeWidth="2" />
        <path d="M9 11H9.01M15 11H15.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M10.5 15L12 16.2L13.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "book") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M5 5.5C5 4.7 5.7 4 6.5 4H11V20H6.5C5.7 20 5 19.3 5 18.5V5.5Z" stroke="currentColor" strokeWidth="2" />
        <path d="M19 5.5C19 4.7 18.3 4 17.5 4H13V20H17.5C18.3 20 19 19.3 19 18.5V5.5Z" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (type === "cap") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M3 9L12 4L21 9L12 14L3 9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M7 12V16C7 17.7 9.2 19 12 19C14.8 19 17 17.7 17 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "network") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M12 12L18 7M12 12L6 7M12 12V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="18" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="6" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="19" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (type === "grid") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M4 4H10V10H4V4Z" stroke="currentColor" strokeWidth="2" />
        <path d="M14 4H20V10H14V4Z" stroke="currentColor" strokeWidth="2" />
        <path d="M4 14H10V20H4V14Z" stroke="currentColor" strokeWidth="2" />
        <path d="M14 14H20V20H14V14Z" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M7 4H15L19 8V20H7V4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M15 4V8H19" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 12H16M10 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export default SupportedBy;