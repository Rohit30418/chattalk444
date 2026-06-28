import React, { useRef } from "react";

const events = [
  {
    title: "Freestyle Rap Battle",
    subtitle: "Tonight @ 9 PM EST",
    tag: "Featured",
    icon: "mic",
    accent: "var(--color-primary)",
    accent2: "var(--color-secondary)",
  },
  {
    title: "Business English",
    subtitle: "Mock Interview Prep",
    tag: "Career",
    icon: "briefcase",
    accent: "var(--color-success)",
    accent2: "var(--color-primary)",
  },
  {
    title: "Anime Spoilers",
    subtitle: "Attack on Titan Debate",
    tag: "Social",
    icon: "dragon",
    accent: "var(--color-warning)",
    accent2: "var(--color-danger)",
  },
  {
    title: "Daily Vocab Streak",
    subtitle: "Keep your fire lit! 🔥",
    tag: "Challenge",
    icon: "fire",
    accent: "var(--color-secondary)",
    accent2: "var(--color-cyan, var(--color-accent))",
  },
  {
    title: "React vs Vue",
    subtitle: "Tech War Room 💻",
    tag: "Tech",
    icon: "code",
    accent: "var(--color-cyan, var(--color-secondary))",
    accent2: "var(--color-secondary)",
  },
  {
    title: "Lofi Study Jam",
    subtitle: "Focus Mode ON 🎧",
    tag: "Chill",
    icon: "headphones",
    accent: "var(--color-primary)",
    accent2: "var(--color-accent)",
  },
  {
    title: "Stand-up Comedy",
    subtitle: "Open Mic Night 🎤",
    tag: "Fun",
    icon: "theater",
    accent: "var(--color-danger)",
    accent2: "var(--color-warning)",
  },
  {
    title: "Global Politics",
    subtitle: "Civil Discourse Only",
    tag: "Debate",
    icon: "globe",
    accent: "var(--color-text)",
    accent2: "var(--color-primary)",
  },
  {
    title: "Harry Potter Trivia",
    subtitle: "Wizards Welcome ⚡",
    tag: "Trivia",
    icon: "wand",
    accent: "var(--color-warning)",
    accent2: "var(--color-accent)",
  },
  {
    title: "Among Us Lobby",
    subtitle: "English Speakers Only",
    tag: "Gaming",
    icon: "gamepad",
    accent: "var(--color-muted)",
    accent2: "var(--color-text)",
  },
];

const FeaturedEvents = () => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  return (
    <div className="group relative w-full">
      <style>{`
        .featured-events-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
          mask-image: linear-gradient(
            90deg,
            transparent 0%,
            black 5%,
            black 95%,
            transparent 100%
          );
        }

        .featured-events-scroll::-webkit-scrollbar {
          display: none;
        }

        .featured-event-card {
          background:
            radial-gradient(
              circle at 84% 18%,
              color-mix(in srgb, var(--color-on-primary) 22%, transparent),
              transparent 30%
            ),
            linear-gradient(135deg, var(--event-accent), var(--event-accent-2));
        }

        .featured-event-card::before {
          content: "";
          position: absolute;
          inset: auto -56px -56px auto;
          width: 150px;
          height: 150px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--color-on-primary) 16%, transparent);
          filter: blur(26px);
          transition: transform 300ms ease, opacity 300ms ease;
          opacity: 0.75;
        }

        .featured-event-card:hover::before {
          transform: scale(1.18);
          opacity: 1;
        }
      `}</style>

      {/* Left Button */}
      <button
        type="button"
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 z-20 -ml-3 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_74%,transparent)] text-[var(--color-text)] opacity-0 [box-shadow:var(--shadow-card)] backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-[var(--color-border-strong)] group-hover:opacity-100"
        aria-label="Scroll left"
      >
        <ChevronIcon direction="left" className="h-5 w-5" />
      </button>

      {/* Right Button */}
      <button
        type="button"
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 z-20 -mr-3 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_74%,transparent)] text-[var(--color-text)] opacity-0 [box-shadow:var(--shadow-card)] backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-[var(--color-border-strong)] group-hover:opacity-100"
        aria-label="Scroll right"
      >
        <ChevronIcon direction="right" className="h-5 w-5" />
      </button>

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="featured-events-scroll -mx-2 flex snap-x gap-5 overflow-x-auto scroll-smooth px-2 py-4"
      >
        {events.map((event) => (
          <EventCard key={event.title} event={event} />
        ))}
      </div>
    </div>
  );
};

const EventCard = ({ event }) => {
  return (
    <article
      className="featured-event-card group/card relative h-[165px] min-w-[280px] cursor-pointer snap-start overflow-hidden rounded-[2rem] p-6 text-[var(--color-on-primary)] [box-shadow:var(--shadow-card)] transition-all duration-300 hover:scale-[1.02] hover:[box-shadow:var(--shadow-soft)] sm:min-w-[310px]"
      style={{
        "--event-accent": event.accent,
        "--event-accent-2": event.accent2,
      }}
    >
      {/* Big faded icon */}
      <div className="absolute right-4 top-4 opacity-15 transition-opacity duration-300 group-hover/card:opacity-25">
        <EventIcon type={event.icon} className="h-16 w-16" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <span className="rounded-xl border border-[color-mix(in_srgb,var(--color-on-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-text)_20%,transparent)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] backdrop-blur-md">
            {event.tag}
          </span>

          {/* <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--color-on-primary)_14%,transparent)] backdrop-blur-md">
            <EventIcon type={event.icon} className="h-4.5 w-4.5" />
          </span> */}
        </div>

        <div>
          <h3 className="mb-1 text-xl text-white leading-tight tracking-[-0.035em] drop-shadow-sm">
            {event.title}
          </h3>

          <p className="flex items-center text-white gap-2 text-sm font-bold opacity-90">
            {event.subtitle}
            <ArrowIcon className="h-3.5 w-3.5 -translate-x-2 opacity-0 transition-all duration-300 group-hover/card:translate-x-0 group-hover/card:opacity-100" />
          </p>
        </div>
      </div>
    </article>
  );
};

const ChevronIcon = ({ direction = "right", className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    {direction === "left" ? (
      <path
        d="M15 6L9 12L15 18"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : (
      <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
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

const EventIcon = ({ type, className = "" }) => {
  if (type === "mic") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M12 14C10.35 14 9 12.65 9 11V6C9 4.35 10.35 3 12 3C13.65 3 15 4.35 15 6V11C15 12.65 13.65 14 12 14Z" stroke="currentColor" strokeWidth="2" />
        <path d="M5 11C5 14.85 8.15 18 12 18C15.85 18 19 14.85 19 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 18V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "briefcase") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M9 7V6C9 4.9 9.9 4 11 4H13C14.1 4 15 4.9 15 6V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M4 9C4 7.9 4.9 7 6 7H18C19.1 7 20 7.9 20 9V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V9Z" stroke="currentColor" strokeWidth="2" />
        <path d="M4 12H20" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (type === "dragon") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M5 15C5 10.6 8.6 7 13 7H16L19 4V9L21 11L18 14H15C13.35 14 12 15.35 12 17V20H9V17C9 15.9 8.1 15 7 15H5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M15 10H15.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "fire") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M12 21C8.7 21 6 18.55 6 15.15C6 12.7 7.45 10.95 9.15 9.35C10.55 8.05 11.9 6.65 12 4C14.75 5.45 17.5 8.35 17.5 13.2C18.2 12.7 18.75 12.05 19 11.2C20.15 14.75 18.4 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "code") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M8 8L4 12L8 16M16 8L20 12L16 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 5L10 19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "headphones") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M4 13C4 8.6 7.6 5 12 5C16.4 5 20 8.6 20 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 13H8V20H6C5.45 20 5 19.55 5 19V13Z" stroke="currentColor" strokeWidth="2" />
        <path d="M19 13H16V20H18C18.55 20 19 19.55 19 19V13Z" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (type === "theater") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M5 5C8 6.5 10 6.5 13 5V12C13 16 10.5 19 9 19C7.5 19 5 16 5 12V5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M11 7C13.8 7.8 16.2 7.8 19 7V13C19 17 16.5 20 15 20C14.25 20 13.2 19.25 12.35 18" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M8 10H8.01M10 14C9.4 14.5 8.6 14.5 8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "globe") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M3 12H21M12 3C14.2 5.4 15.3 8.4 15.3 12C15.3 15.6 14.2 18.6 12 21C9.8 18.6 8.7 15.6 8.7 12C8.7 8.4 9.8 5.4 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "wand") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M5 19L19 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M15 5L19 9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M7 5L7.6 6.4L9 7L7.6 7.6L7 9L6.4 7.6L5 7L6.4 6.4L7 5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M17 15L17.8 17.2L20 18L17.8 18.8L17 21L16.2 18.8L14 18L16.2 17.2L17 15Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M7 10H17C19.2 10 21 11.8 21 14V16C21 18.2 19.2 20 17 20C15.9 20 14.9 19.55 14.2 18.8H9.8C9.1 19.55 8.1 20 7 20C4.8 20 3 18.2 3 16V14C3 11.8 4.8 10 7 10Z" stroke="currentColor" strokeWidth="2" />
      <path d="M8 14V17M6.5 15.5H9.5M16 15H16.01M18.5 16.5H18.51" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
};

export default FeaturedEvents;