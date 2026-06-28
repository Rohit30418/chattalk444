import React, { useCallback, useEffect, useState } from "react";

// --- DATA GENERATORS ---
const NAMES = [
  "Sarah",
  "Raj",
  "Mike",
  "Anya",
  "Jin",
  "Fatima",
  "Carlos",
  "Priya",
  "John",
  "Emma",
];

const ACTIONS = [
  {
    text: "joined",
    accent: "var(--color-success)",
    icon: "door",
  },
  {
    text: "is speaking in",
    accent: "var(--color-primary)",
    icon: "mic",
  },
  {
    text: "reached Lvl 5",
    accent: "var(--color-warning)",
    icon: "fire",
  },
  {
    text: "created room",
    accent: "var(--color-secondary)",
    icon: "plus",
  },
];

const ROOMS = [
  "English Cafe",
  "Anime Talk",
  "Biz English",
  "Chill Zone",
  "Rap God",
  "Tech Talk",
];

const initialActivities = [
  {
    id: 1,
    name: "Sarah",
    action: ACTIONS[0],
    room: "English Cafe",
    time: "Just now",
  },
  {
    id: 2,
    name: "Raj",
    action: ACTIONS[1],
    room: "Anime Talk",
    time: "2m ago",
  },
  {
    id: 3,
    name: "Mike",
    action: ACTIONS[2],
    room: "",
    time: "5m ago",
  },
];

const LiveActivityFeed = () => {
  const [activities, setActivities] = useState(initialActivities);

  const addNewActivity = useCallback(() => {
    const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
    const randomAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    const randomRoom = randomAction.text.includes("Lvl")
      ? ""
      : ROOMS[Math.floor(Math.random() * ROOMS.length)];

    const newActivity = {
      id: Date.now(),
      name: randomName,
      action: randomAction,
      room: randomRoom,
      time: "Just now",
      isNew: true,
    };

    setActivities((prev) =>
      [newActivity, ...prev]
        .slice(0, 5)
        .map((item, index) => ({
          ...item,
          time: index === 0 ? "Just now" : item.time === "Just now" ? "1m ago" : item.time,
          isNew: index === 0,
        }))
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(addNewActivity, 4000);
    return () => clearInterval(interval);
  }, [addNewActivity]);

  return (
    <div className="relative h-fit w-full overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] p-6 [box-shadow:var(--shadow-card)] backdrop-blur-xl">
      <style>{`
        .activity-card-glow {
          background: radial-gradient(
            circle,
            color-mix(in srgb, var(--color-primary) 14%, transparent),
            transparent 70%
          );
        }

        .activity-item-new {
          animation: activitySlideIn 520ms ease both;
        }

        @keyframes activitySlideIn {
          from {
            opacity: 0;
            transform: translateX(18px) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
        }
      `}</style>

      {/* Background glow */}
      <div className="activity-card-glow pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl" />

      {/* Header */}
      <div className="relative z-10 mb-8 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-black tracking-[-0.03em] text-[var(--color-text)]">
            Happening Now
          </h3>
          <p className="mt-1 text-xs font-bold text-[var(--color-soft)]">
            Real-time learner activity
          </p>
        </div>

        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-success)]" />
        </span>
      </div>

      <div className="relative z-10 space-y-7 pl-2">
        {/* Timeline line */}
        <div className="absolute bottom-3 left-[13px] top-3 w-[2px] rounded-full bg-[var(--color-border)]" />

        {activities.map((item, index) => (
          <ActivityItem key={item.id} item={item} index={index} />
        ))}
      </div>
    </div>
  );
};

const ActivityItem = ({ item, index }) => {
  return (
    <div
      className={`group relative pl-11 transition-all duration-500 ${
        item.isNew ? "activity-item-new" : ""
      }`}
      style={{ "--activity-accent": item.action.accent }}
    >
      {/* Dot/Icon */}
      <div className="absolute -left-1 top-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border-4 border-[var(--color-surface)] bg-[var(--activity-accent)] text-[var(--color-on-primary)] [box-shadow:var(--shadow-card)] transition-transform duration-300 group-hover:scale-110">
        <ActionIcon type={item.action.icon} className="h-3.5 w-3.5" />
      </div>

      <div>
        <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-soft)]">
          {index === 0 ? "Just Now" : item.time}
        </span>

        <p className="text-sm font-medium leading-snug text-[var(--color-muted)]">
          <span className="font-black text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary-700)]">
            {item.name}
          </span>

          <span className="opacity-85"> {item.action.text}</span>

          {item.room && (
            <span className="mt-2 flex w-fit items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-xs font-black text-[var(--color-primary-700)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--activity-accent)]" />
              {item.room}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

const ActionIcon = ({ type, className = "" }) => {
  if (type === "door") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path
          d="M5 21V4.8C5 3.8 5.8 3 6.8 3H17V21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M9 21H20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M14 12H14.01"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "mic") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 14C10.35 14 9 12.65 9 11V6C9 4.35 10.35 3 12 3C13.65 3 15 4.35 15 6V11C15 12.65 13.65 14 12 14Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M5 11C5 14.85 8.15 18 12 18C15.85 18 19 14.85 19 11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 18V21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "fire") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 21C8.7 21 6 18.55 6 15.15C6 12.7 7.45 10.95 9.15 9.35C10.55 8.05 11.9 6.65 12 4C14.75 5.45 17.5 8.35 17.5 13.2C18.2 12.7 18.75 12.05 19 11.2C20.15 14.75 18.4 21 12 21Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default LiveActivityFeed;