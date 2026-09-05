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

const FeaturedLanguages = () => {
  return (
    <section className="bg-[var(--color-bg)] px-4 py-16 text-[var(--color-text)] sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-primary-700)] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {languages.map((lang) => (
            <LanguageCard key={lang.code} lang={lang} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-black text-[var(--color-primary-700)] shadow-sm transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]"
          >
            View all 120+ languages
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
};

const LanguageCard = ({ lang }) => (
  <div className="flex items-center gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm transition-colors hover:border-[var(--color-border-strong)] sm:p-5">
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] ring-1 ring-[var(--color-border)]">
      <img
        src={`https://flagsapi.com/${lang.code}/flat/64.png`}
        alt={lang.name}
        className="h-10 w-10 object-contain"
        loading="lazy"
        decoding="async"
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

export default FeaturedLanguages;
