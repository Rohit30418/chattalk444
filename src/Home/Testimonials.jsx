import React from "react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "English Learner",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    result: "Improved confidence",
    text: "Vaani helped me speak English without fear. The live rooms feel friendly and Luna AI gives useful corrections instantly.",
  },
  {
    name: "Daniel Kim",
    role: "Japanese Learner",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    result: "Practiced for 21 days",
    text: "I improved my speaking confidence in just a few weeks. The rooms are simple, practical, and very easy to join.",
  },
  {
    name: "Sofia Martinez",
    role: "French Learner",
    image: "https://randomuser.me/api/portraits/women/65.jpg",
    result: "Better pronunciation",
    text: "Luna feels like a personal tutor. I can practice anytime and get grammar and pronunciation help while speaking.",
  },
];

const Testimonials = () => {
  return (
    <section className="bg-[var(--color-bg-soft)] px-4 py-16 text-[var(--color-text)] sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-primary-700)] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
            Loved by Learners
          </span>

          <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] text-[var(--color-text)] sm:text-5xl">
            Real stories from{" "}
            <span className="bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] bg-clip-text text-transparent">
              language learners
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-[var(--color-muted)] sm:text-lg">
            Learners are building confidence every day with live practice rooms
            and Luna AI.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <article
              key={item.name}
              className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-colors hover:border-[var(--color-border-strong)]"
            >
              <div className="mb-5 flex items-center gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-14 w-14 rounded-2xl object-cover ring-2 ring-[var(--color-primary-soft)]"
                  loading="lazy"
                  decoding="async"
                />

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-[var(--color-text)]">
                      {item.name}
                    </h3>
                    <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
                  </div>

                  <p className="text-sm font-semibold text-[var(--color-muted)]">
                    {item.role}
                  </p>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex gap-1 text-[var(--color-warning)]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <StarIcon key={index} className="h-4 w-4" />
                  ))}
                </div>

                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-black text-[var(--color-primary-700)]">
                  {item.result}
                </span>
              </div>

              <p className="text-sm font-medium leading-7 text-[var(--color-muted)]">
                “{item.text}”
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

const StarIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.5L14.9 8.6L21.5 9.5L16.75 14.15L17.9 20.7L12 17.6L6.1 20.7L7.25 14.15L2.5 9.5L9.1 8.6L12 2.5Z" />
  </svg>
);

export default Testimonials;
