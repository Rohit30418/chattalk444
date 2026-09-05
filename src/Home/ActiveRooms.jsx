import React from "react";
import { Link } from "react-router-dom";

const rooms = [
  {
    id: 1,
    title: "🦥 Procrastinators Assemble #6",
    language: "Portuguese",
    flag: "https://flagsapi.com/PT/flat/64.png",
    level: "Intermediate",
    participants: ["Fatima", "Sara", "Jake", "Mia", "Leo"],
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
    participants: ["Ahmed", "Zuri", "Camille"],
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
    participants: ["Jean", "Jake", "Rohit", "Valentina"],
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
    participants: ["Sara", "Max"],
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
    participants: ["Neha", "Layla", "Omar", "Hiro", "Camille", "Rohit"],
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
    participants: ["Mateo", "Hiro", "Jean", "Omar", "Mia"],
    host: "Mateo",
    seats: 5,
    capacity: 8,
    status: "open",
  },
];

export default function ActiveRoomsSection() {
  return (
    <section className="bg-[var(--color-bg-soft)] px-4 py-16 text-[var(--color-text)] sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--color-primary-700)] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>

        <div className="mt-10 text-center lg:mt-12">
          <Link
            to="/rooms"
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm font-black text-[var(--color-primary-700)] shadow-sm transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]"
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
    <article className="flex min-h-[300px] flex-col justify-between rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition-colors hover:border-[var(--color-border-strong)] sm:min-h-[320px] sm:p-6">
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-xs font-black text-[var(--color-muted)]">
            <img
              src={room.flag}
              alt=""
              className="h-4 w-4 object-contain"
              loading="lazy"
              decoding="async"
            />
            {room.language}
          </div>

          <div className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-xs font-black text-[var(--color-muted)]">
            {room.level}
          </div>

          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
              isFull
                ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
                : "bg-[var(--color-primary-soft)] text-[var(--color-success)]"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isFull ? "bg-[var(--color-warning)]" : "bg-[var(--color-success)]"}`} />
            {isFull ? "Full" : "Live"}
          </div>
        </div>

        <h3 className="line-clamp-2 text-lg font-black leading-tight tracking-[-0.03em] text-[var(--color-text)] sm:text-xl">
          {room.title}
        </h3>

        <p className="mt-3 text-sm font-semibold leading-6 text-[var(--color-muted)]">
          Hosted by {room.host}. Practice naturally with learners in a friendly live room.
        </p>
      </div>

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center -space-x-2 pl-1">
            {room.participants.slice(0, 4).map((name, index) => (
              <div
                key={`${name}-${index}`}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-primary-soft)] text-xs font-black text-[var(--color-primary-700)]"
                title={name}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            ))}

            {room.participants.length > 4 && (
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-surface-2)] text-[10px] font-black text-[var(--color-muted)]">
                +{room.participants.length - 4}
              </div>
            )}
          </div>

          <div className="text-right">
            <p className="text-xs font-black text-[var(--color-text)]">
              {room.seats}/{room.capacity} speaking
            </p>
            <p className={`mt-0.5 text-[11px] font-bold ${isFull ? "text-[var(--color-warning)]" : "text-[var(--color-success)]"}`}>
              {isFull ? "No seats left" : `${openSeats} seats left`}
            </p>
          </div>
        </div>

        <div className="mb-4 h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
          <div
            className="h-full rounded-full bg-[var(--color-primary)]"
            style={{ width: seatFill }}
          />
        </div>

        <button
          type="button"
          disabled={isFull}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition-colors ${
            isFull
              ? "cursor-not-allowed border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-soft)]"
              : "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-600)]"
          }`}
        >
          {isFull ? "Notify Me" : "Join Room"}
          {!isFull && <ArrowIcon className="h-4 w-4" />}
        </button>
      </div>
    </article>
  );
};

const ArrowIcon = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5 12H19M13 6L19 12L13 18"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
