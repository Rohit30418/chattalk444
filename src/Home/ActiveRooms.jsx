import React from "react";
import { Link } from "react-router-dom";

const rooms = [
  {
    id: 1,
    title: "🦥 Procrastinators Assemble #6",
    language: "Portuguese",
    flag: "https://flagsapi.com/PT/flat/64.png",
    level: "Intermediate",
    accent: "var(--color-primary)",
    participants: ["Fatima1", "Sara2", "Jake3", "Fatima4", "Extra1"],
    host: "Fatima",
    seats: 5,
    capacity: 6,
    status: "open",
  },
  {
    id: 2,
    title: "🫠 Socially Awkward Club #5",
    language: "Urdu",
    flag: "https://flagsapi.com/PK/flat/64.png",
    level: "Advanced",
    accent: "var(--color-warning)",
    participants: ["Ahmed1", "Zuri2", "Camille3"],
    host: "Ahmed",
    seats: 3,
    capacity: 5,
    status: "open",
  },
  {
    id: 3,
    title: "🎤 Mic Check for No Reason #6",
    language: "Hindi",
    flag: "https://flagsapi.com/IN/flat/64.png",
    level: "Upper Intermediate",
    accent: "var(--color-success)",
    participants: ["Jean1", "Jake2", "Rohit3", "Valentina4"],
    host: "Rohit",
    seats: 6,
    capacity: 6,
    status: "full",
  },
  {
    id: 4,
    title: "🎮 Gamers Who Rage Quit #5",
    language: "German",
    flag: "https://flagsapi.com/DE/flat/64.png",
    level: "Upper Intermediate",
    accent: "var(--color-secondary)",
    participants: ["Sara1", "Sara2"],
    host: "Sara",
    seats: 2,
    capacity: 6,
    status: "open",
  },
  {
    id: 5,
    title: "🎵 Singing Like No One’s Judging #4",
    language: "English",
    flag: "https://flagsapi.com/GB/flat/64.png",
    level: "Beginner",
    accent: "var(--color-accent)",
    participants: ["Neha1", "Layla2", "Omar3", "Hiro4", "Camille5", "Rohit6"],
    host: "Neha",
    seats: 6,
    capacity: 6,
    status: "full",
  },
  {
    id: 6,
    title: "🚪 People Who Just Left Zoom Calls #4",
    language: "Mandarin",
    flag: "https://flagsapi.com/CN/flat/64.png",
    level: "Beginner",
    accent: "var(--color-primary-600)",
    participants: ["Mateo1", "Hiro2", "Jean3", "Mateo4", "Omar5"],
    host: "Mateo",
    seats: 5,
    capacity: 8,
    status: "open",
  },
];

export default function ActiveRoomsSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-bg-soft)] px-4 py-16 text-[var(--color-text)] transition-colors duration-300 sm:px-6 lg:px-8 lg:py-24">
      <style>{`
        .active-room-card::before {
          content: "";
          position: absolute;
          inset: auto -72px -72px auto;
          width: 190px;
          height: 190px;
          border-radius: 999px;
          background: radial-gradient(
            circle,
            color-mix(in srgb, var(--room-accent) 22%, transparent),
            transparent 70%
          );
          filter: blur(22px);
          opacity: 0.72;
          transition: opacity 240ms ease, transform 240ms ease;
        }

        .active-room-card:hover::before {
          opacity: 1;
          transform: scale(1.08);
        }

        .seat-progress {
          background:
            linear-gradient(
              90deg,
              var(--room-accent) var(--seat-fill),
              color-mix(in srgb, var(--color-border) 70%, transparent) var(--seat-fill)
            );
        }
      `}</style>

      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-primary-700)] [box-shadow:var(--shadow-card)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-success)]" />
            </span>
            Live Now
          </span>

          <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] text-[var(--color-text)] sm:text-4xl md:text-5xl">
            Active{" "}
            <span className="bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] bg-clip-text text-transparent">
              Voice Rooms
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-[var(--color-muted)] sm:text-lg">
            Jump into live conversations happening right now. Practice with real
            learners or get support from Luna AI.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>

        {/* View All Link */}
        <div className="mt-10 text-center lg:mt-12">
          <Link
            to="/rooms"
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_90%,transparent)] px-5 py-3 text-sm font-black text-[var(--color-primary-700)] [box-shadow:var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)]"
          >
            View all active rooms
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

const RoomCard = ({ room }) => {
  const isFull = room.status === "full";
  const seatFill = `${Math.min((room.seats / room.capacity) * 100, 100)}%`;
  const openSeats = Math.max(room.capacity - room.seats, 0);

  return (
    <article
      className="active-room-card group relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_94%,transparent)] p-5 [box-shadow:var(--shadow-card)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-border-strong)] hover:[box-shadow:var(--shadow-soft)] sm:min-h-[320px] sm:p-6"
      style={{
        "--room-accent": room.accent,
        "--seat-fill": seatFill,
      }}
    >
      {/* Top */}
      <div className="relative z-10">
        <div className="mb-4 flex flex-wrap items-center gap-2 pr-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-xs font-black text-[var(--color-muted)]">
            <img
              src={room.flag}
              alt={room.language}
              className="h-4 w-4 object-contain"
              loading="lazy"
            />
            {room.language}
          </div>

          <div className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--room-accent)_26%,transparent)] bg-[color-mix(in_srgb,var(--room-accent)_10%,transparent)] px-3 py-1 text-xs font-black text-[var(--color-text)]">
            {room.level}
          </div>

          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${
              isFull
                ? "border-[color-mix(in_srgb,var(--color-warning)_28%,transparent)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
                : "border-[color-mix(in_srgb,var(--color-success)_24%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] text-[var(--color-success)]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isFull ? "bg-[var(--color-warning)]" : "bg-[var(--color-success)]"
              }`}
            />
            {isFull ? "Full" : "Live"}
          </div>
        </div>

        <h3 className="line-clamp-2 text-lg font-black leading-tight tracking-[-0.03em] text-[var(--color-text)] sm:text-xl">
          {room.title}
        </h3>

        <p className="mt-3 text-sm font-semibold leading-6 text-[var(--color-muted)]">
          Hosted by {room.host}. Practice naturally with learners in a friendly
          live room.
        </p>
      </div>

      {/* Bottom */}
      <div className="relative z-10 mt-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center -space-x-3 pl-1">
            {room.participants.slice(0, 5).map((seed, index) => (
              <div
                key={seed}
                className="relative transition-transform duration-300 hover:z-10 hover:scale-110"
                style={{ zIndex: 10 - index }}
              >
                <img
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${seed}`}
                  alt="Participant"
                  className="h-10 w-10 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-surface-2)] object-cover"
                  loading="lazy"
                />
              </div>
            ))}

            {room.participants.length > 5 && (
              <div className="relative z-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-surface-2)] text-xs font-black text-[var(--color-muted)]">
                +{room.participants.length - 5}
              </div>
            )}
          </div>

          <div className="text-right">
            <p className="text-xs font-black text-[var(--color-text)]">
              {room.seats}/{room.capacity} speaking
            </p>
            <p
              className={`mt-0.5 text-[11px] font-bold ${
                isFull
                  ? "text-[var(--color-warning)]"
                  : "text-[var(--color-success)]"
              }`}
            >
              {isFull ? "No seats left" : `${openSeats} seats left`}
            </p>
          </div>
        </div>

        <div className="mb-4 h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
          <div className="seat-progress h-full rounded-full" />
        </div>

        <button
          type="button"
          disabled={isFull}
          className={`group/btn flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition-all duration-300 ${
            isFull
              ? "border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-soft)]"
              : "bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)] hover:-translate-y-0.5"
          }`}
        >
          {isFull ? "Notify Me" : "Join Room"}

          {!isFull && (
            <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
          )}
        </button>
      </div>
    </article>
  );
};

const ArrowIcon = ({ className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M5 12H19M13 6L19 12L13 18"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);