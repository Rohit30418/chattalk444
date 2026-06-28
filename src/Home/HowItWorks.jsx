import React from "react";

const learners = [
  {
    name: "Rohit",
    location: "New Delhi, India",
    country: "IN",
    initial: "R",
    wants: "English",
    goal: "Improve English for interviews",
    quote: "I get nervous in interviews. I want to sound confident.",
  },
  {
    name: "Sofia",
    location: "Madrid, Spain",
    country: "ES",
    initial: "S",
    wants: "Hindi",
    goal: "Learn Hindi for travel",
    quote: "I’m visiting India next month and want to greet locals.",
  },
];

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-[var(--color-bg)] px-4 py-16 text-[var(--color-text)] sm:px-6 lg:px-8 lg:py-24"
    >
      <style>{`
        .human-story-card {
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--color-surface) 98%, transparent),
              color-mix(in srgb, var(--color-bg-lift, var(--color-bg-soft)) 38%, var(--color-surface))
            );
        }

        .human-story-card:hover {
          border-color: var(--color-border-strong);
          box-shadow: var(--shadow-soft);
          transform: translateY(-4px);
        }

        .human-avatar-ring {
          box-shadow:
            0 0 0 6px color-mix(in srgb, var(--color-primary) 10%, transparent),
            var(--shadow-card);
        }

        .human-connector-line {
          background: linear-gradient(
            90deg,
            transparent,
            color-mix(in srgb, var(--color-primary) 24%, transparent),
            transparent
          );
        }
      `}</style>

      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-12%] top-20 h-80 w-80 rounded-full bg-[var(--color-primary-soft)] blur-[100px]" />
        <div className="absolute right-[-12%] bottom-20 h-96 w-96 rounded-full bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] blur-[110px]" />
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-4xl text-center lg:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-primary-700)] [box-shadow:var(--shadow-card)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-success)] shadow-[0_0_0_6px_var(--color-primary-soft)]" />
            Human First
          </span>

          <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-black leading-[1.08] tracking-[-0.05em] text-[var(--color-text)] sm:text-5xl lg:text-6xl">
            Vaani connects people through{" "}
            <span className="bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] bg-clip-text text-transparent">
              real conversations.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-base font-medium leading-8 text-[var(--color-muted)] sm:text-lg">
            Two learners. Two goals. One room. Practice with real people and
            grow together with Luna AI by your side.
          </p>
        </div>

        {/* Story Cards */}
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
          <div className="human-connector-line absolute left-[18%] right-[18%] top-1/2 hidden h-px -translate-y-1/2 lg:block" />

          <LearnerCard learner={learners[0]} />

          {/* Match Connector */}
          <div className="relative z-10 flex flex-col items-center justify-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)] sm:h-20 sm:w-20 sm:rounded-[1.65rem]">
              <HeartIcon className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>

            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-black text-[var(--color-text)] [box-shadow:var(--shadow-card)]">
              Matched in Live Room
            </span>
          </div>

          <LearnerCard learner={learners[1]} />
        </div>

        {/* Luna AI Support Card */}
        <div className="mx-auto mt-8 max-w-3xl rounded-[2rem] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_94%,transparent)] p-5 [box-shadow:var(--shadow-soft)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-border-strong)] sm:p-7 lg:mt-10">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)]">
              <SparkIcon className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-xl font-black tracking-[-0.035em] text-[var(--color-text)] sm:text-2xl">
                Practice with real people. Improve with{" "}
                <span className="text-[var(--color-primary-700)]">
                  Luna AI.
                </span>
              </h3>

              <p className="mt-2 text-sm font-medium leading-7 text-[var(--color-muted)] sm:text-base">
                Live feedback on pronunciation, grammar, and fluency — while
                you’re still speaking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const LearnerCard = ({ learner }) => {
  return (
    <article className="human-story-card relative z-10 rounded-[2rem] border border-[var(--color-border)] p-5 [box-shadow:var(--shadow-card)] backdrop-blur-xl transition-all duration-300 sm:p-7">
      <div className="flex items-start gap-4">
        <div className="human-avatar-ring flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] text-xl font-black text-[var(--color-on-primary)]">
          {learner.initial}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black tracking-[-0.03em] text-[var(--color-text)]">
              {learner.name}
            </h3>
            <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
          </div>

          <p className="mt-1 text-sm font-semibold text-[var(--color-muted)]">
            {learner.location}{" "}
            <span className="text-[10px] font-black uppercase text-[var(--color-soft)]">
              {learner.country}
            </span>
          </p>

          <span className="mt-2 inline-flex rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-black text-[var(--color-primary-700)]">
            Wants: {learner.wants}
          </span>
        </div>
      </div>

      <h4 className="mt-6 text-base font-black leading-snug text-[var(--color-text)] sm:text-lg">
        {learner.goal}
      </h4>

      <div className="mt-4 rounded-[1.5rem] bg-[var(--color-bg-soft)] px-5 py-4">
        <p className="text-sm font-semibold italic leading-7 text-[var(--color-muted)] sm:text-base">
          “{learner.quote}”
        </p>
      </div>
    </article>
  );
};

const HeartIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M20.8 8.6C20.8 13.4 12 20 12 20C12 20 3.2 13.4 3.2 8.6C3.2 5.9 5.25 4 7.75 4C9.2 4 10.55 4.7 11.35 5.8C11.55 6.05 11.9 6.05 12.1 5.8C12.9 4.7 14.25 4 15.7 4C18.75 4 20.8 5.9 20.8 8.6Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const SparkIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M19 15L19.8 17.2L22 18L19.8 18.8L19 21L18.2 18.8L16 18L18.2 17.2L19 15Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M5 14L5.7 15.8L7.5 16.5L5.7 17.2L5 19L4.3 17.2L2.5 16.5L4.3 15.8L5 14Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export default HowItWorks;