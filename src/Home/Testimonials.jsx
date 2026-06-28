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
    <section className="relative overflow-hidden bg-[var(--color-bg-soft)] px-4 py-16 text-[var(--color-text)] transition-colors duration-300 sm:px-6 lg:px-8 lg:py-24">
      <style>{`
        .testimonial-card {
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--color-surface) 98%, transparent),
              color-mix(in srgb, var(--color-bg-lift, var(--color-bg-soft)) 42%, var(--color-surface))
            );
        }

        .testimonial-card::before {
          content: "";
          position: absolute;
          inset: auto -70px -70px auto;
          width: 190px;
          height: 190px;
          border-radius: 999px;
          background: radial-gradient(
            circle,
            color-mix(in srgb, var(--color-primary) 16%, transparent),
            transparent 70%
          );
          filter: blur(22px);
          opacity: 0.7;
          transition: opacity 220ms ease, transform 220ms ease;
        }

        .testimonial-card:hover::before {
          opacity: 1;
          transform: scale(1.08);
        }

        .testimonial-avatar {
          box-shadow:
            0 0 0 4px var(--color-surface),
            0 0 0 6px color-mix(in srgb, var(--color-primary) 16%, transparent),
            var(--shadow-card);
        }
      `}</style>

      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-20 hidden h-80 w-80 rounded-full bg-[var(--color-primary-soft)] blur-[90px] lg:block" />
        <div className="absolute right-[-10%] bottom-20 hidden h-80 w-80 rounded-full bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] blur-[90px] lg:block" />
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-primary-700)] [box-shadow:var(--shadow-card)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-success)] shadow-[0_0_0_6px_var(--color-primary-soft)]" />
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

        {/* Cards */}
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <article
              key={item.name}
              className="testimonial-card relative overflow-hidden rounded-[2rem] border border-[var(--color-border)] p-6 [box-shadow:var(--shadow-card)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-[var(--color-border-strong)] hover:[box-shadow:var(--shadow-soft)]"
            >
              <div className="relative z-10">
                <div className="mb-5 flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="testimonial-avatar h-14 w-14 rounded-2xl object-cover"
                    loading="lazy"
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
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

const StarIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.5L14.9 8.6L21.5 9.5L16.75 14.15L17.9 20.7L12 17.6L6.1 20.7L7.25 14.15L2.5 9.5L9.1 8.6L12 2.5Z" />
  </svg>
);

export default Testimonials;