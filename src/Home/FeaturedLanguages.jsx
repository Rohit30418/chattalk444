import React from "react";

const languages = [
  { code: "US", name: "English USA", users: 12000 },
  { code: "GB", name: "English UK", users: 9500 },
  { code: "IN", name: "Hindi India", users: 8700 },
  { code: "ES", name: "Spanish", users: 14300 },
  { code: "FR", name: "French", users: 7600 },
  { code: "DE", name: "German", users: 5400 },
  { code: "IT", name: "Italian", users: 4800 },
  { code: "PT", name: "Portuguese", users: 5200 },
  { code: "RU", name: "Russian", users: 3900 },
  { code: "JP", name: "Japanese", users: 6200 },
  { code: "KR", name: "Korean", users: 7100 },
  { code: "CN", name: "Chinese", users: 8300 },
];

const firstRow = languages.slice(0, 6);
const secondRow = languages.slice(6);

const FeaturedLanguages = () => {
  return (
    <section className="relative overflow-hidden bg-[var(--color-bg)] px-4 py-16 text-[var(--color-text)] transition-colors duration-300 sm:px-6 lg:px-8 lg:py-24">
      <style>{`
        .language-marquee {
          display: flex;
          width: max-content;
          will-change: transform;
        }

        .language-marquee-left {
          animation: languageScrollLeft 28s linear infinite;
        }

        .language-marquee-right {
          animation: languageScrollRight 28s linear infinite;
        }

        .language-marquee:hover {
          animation-play-state: paused;
        }

        .language-fade-left {
          background: linear-gradient(
            90deg,
            var(--color-bg) 0%,
            color-mix(in srgb, var(--color-bg) 72%, transparent) 48%,
            transparent 100%
          );
        }

        .language-fade-right {
          background: linear-gradient(
            270deg,
            var(--color-bg) 0%,
            color-mix(in srgb, var(--color-bg) 72%, transparent) 48%,
            transparent 100%
          );
        }

        .language-card {
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--color-surface) 98%, transparent),
              color-mix(in srgb, var(--color-bg-lift, var(--color-bg-soft)) 52%, var(--color-surface))
            );
        }

        .language-card:hover {
          border-color: var(--color-border-strong);
          box-shadow: var(--shadow-soft);
        }

        @keyframes languageScrollLeft {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        @keyframes languageScrollRight {
          from {
            transform: translateX(-50%);
          }
          to {
            transform: translateX(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .language-marquee-left,
          .language-marquee-right {
            animation: none;
          }
        }
      `}</style>

      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-10 hidden h-80 w-80 rounded-full bg-[var(--color-primary-soft)] blur-[90px] lg:block" />
        <div className="absolute right-[-10%] bottom-10 hidden h-80 w-80 rounded-full bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] blur-[90px] lg:block" />
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_90%,transparent)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-primary-700)] [box-shadow:var(--shadow-card)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-success)] shadow-[0_0_0_6px_var(--color-primary-soft)]" />
            Global Community
          </span>

          <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] text-[var(--color-text)] sm:text-5xl">
            Featured{" "}
            <span className="bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] bg-clip-text text-transparent">
              Languages
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-[var(--color-muted)] sm:text-lg">
            Join thousands of learners practicing popular languages in live rooms
            every day.
          </p>
        </div>

        {/* Scrolling Rows */}
        <div className="space-y-5 overflow-hidden">
          <MarqueeRow items={firstRow} direction="left" />
          <MarqueeRow items={secondRow} direction="right" />
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] px-6 py-3 text-sm font-black text-[var(--color-primary-700)] [box-shadow:var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)]"
          >
            View all 120+ languages
            <span>→</span>
          </button>
        </div>
      </div>
    </section>
  );
};

const MarqueeRow = ({ items, direction }) => {
  const loopItems = [...items, ...items, ...items, ...items];

  return (
    <div className="relative overflow-hidden">
      {/* Side fade */}
      <div className="language-fade-left pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-28" />
      <div className="language-fade-right pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-28" />

      <div
        className={`language-marquee gap-4 ${
          direction === "left"
            ? "language-marquee-left"
            : "language-marquee-right"
        }`}
      >
        {loopItems.map((lang, index) => (
          <LanguageCard key={`${lang.code}-${index}`} lang={lang} />
        ))}
      </div>
    </div>
  );
};

const LanguageCard = ({ lang }) => {
  return (
    <div className="language-card group flex min-w-[230px] items-center gap-4 rounded-3xl border border-[var(--color-border)] p-4 [box-shadow:var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 sm:min-w-[260px] sm:p-5">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] ring-1 ring-[var(--color-border)] transition-transform duration-200 group-hover:scale-105">
        <img
          src={`https://flagsapi.com/${lang.code}/flat/64.png`}
          alt={lang.name}
          className="h-10 w-10 object-contain"
          loading="lazy"
        />
      </div>

      <div className="min-w-0">
        <h3 className="truncate text-base font-black text-[var(--color-text)]">
          {lang.name}
        </h3>

        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-xs font-bold text-[var(--color-soft)]">
          <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
          {lang.users.toLocaleString()} online
        </div>
      </div>
    </div>
  );
};

export default FeaturedLanguages;