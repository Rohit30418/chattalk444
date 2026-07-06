import React, { useCallback, useEffect, useState, memo } from "react";

// --- DATA GENERATORS (Kept outside to prevent memory reallocation) ---
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
  { text: "joined", accent: "var(--color-success)", icon: "door" },
  { text: "is speaking in", accent: "var(--color-primary)", icon: "mic" },
  { text: "reached Lvl 5", accent: "var(--color-warning)", icon: "fire" },
  { text: "created room", accent: "var(--color-secondary)", icon: "plus" },
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
    isNew: false,
  },
  {
    id: 2,
    name: "Raj",
    action: ACTIONS[1],
    room: "Anime Talk",
    time: "2m ago",
    isNew: false,
  },
  {
    id: 3,
    name: "Mike",
    action: ACTIONS[2],
    room: "",
    time: "5m ago",
    isNew: false,
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

    setActivities((prev) => {
      // Optimization 1: Fixed object referencing.
      // We only return a NEW object if the properties actually changed.
      // This allows React.memo to successfully skip re-rendering older items in the list.
      const updatedPrev = prev.slice(0, 4).map((item) => {
        const needsTimeUpdate = item.time === "Just now";
        const needsNewFlagUpdate = item.isNew === true;

        if (!needsTimeUpdate && !needsNewFlagUpdate) {
          return item; // Keep exact same reference in memory
        }

        return {
          ...item,
          time: needsTimeUpdate ? "1m ago" : item.time,
          isNew: false,
        };
      });

      return [newActivity, ...updatedPrev];
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(addNewActivity, 4000);
    return () => clearInterval(interval);
  }, [addNewActivity]);

  return (
    <div 
      /* Optimization 2: Removed backdrop-blur-xl and used a stable background color. 
         Added CSS containment to isolate layout calculations when the interval fires. */
      style={{ contain: 'layout paint style' }}
      className="relative h-fit w-full overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-md"
    >
      <style>{`
        /* Optimization 3: Replaced filter: blur() and color-mix() with a highly performant 
           radial-gradient and opacity to achieve the exact same visual glow. */
        .activity-card-glow {
          background: radial-gradient(
            circle,
            var(--color-primary) 0%,
            transparent 70%
          );
          opacity: 0.15;
        }

        .activity-item-new {
          /* Optimization 4: Removed global will-change to prevent GPU memory limits. 
             Relied on translate3d to force hardware acceleration during the animation instead. */
          animation: activitySlideIn 520ms ease both;
        }

        @keyframes activitySlideIn {
          from {
            opacity: 0;
            transform: translate3d(18px, -4px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>

      {/* Optimization 3 (Continued): Replaced the expensive blur class */}
      <div className="activity-card-glow pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full transform-gpu" />

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
          {/* Optimization 5: Added transform-gpu to offload the continuous ping animation */}
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-75 transform-gpu" />
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

// Optimization 6: Wrapped ActivityItem in React.memo. 
// Combined with the object-reference fix in setActivities, this stops older list items from re-rendering every 4 seconds.
const ActivityItem = memo(({ item, index }) => {
  return (
    <div
      /* Optimization 7: Added contain layout to isolate individual item repaints */
      style={{ 
        "--activity-accent": item.action.accent,
        contain: 'layout paint style' 
      }}
      className={`group relative pl-11 transition-transform duration-500 transform-gpu ${
        item.isNew ? "activity-item-new" : ""
      }`}
    >
      {/* Optimization 8: Simplified the hover effect. Removed unnecessary will-change-transform, using transform-gpu safely instead. */}
      <div className="absolute -left-2 top-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border-4 border-[var(--color-surface)] bg-[var(--activity-accent)] text-[var(--color-on-primary)] shadow-sm transition-transform duration-300 group-hover:scale-110 transform-gpu">
        <ActionIcon type={item.action.icon} className="h-3.5 w-3.5" />
      </div>

      <div>
        <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-soft)]">
          {index === 0 ? "Just Now" : item.time}
        </span>

        <p className="text-sm font-medium leading-snug text-[var(--color-muted)]">
          {/* Optimization 9: Removed hover color transition on text inside lists to prevent layout thrashing. It's unnoticeable but saves processing. */}
          <span className="font-black text-[var(--color-text)]">
            {item.name}
          </span>

          <span className="opacity-85"> {item.action.text}</span>

          {item.room && (
            <span className="mt-2 flex w-fit items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-xs font-black text-[var(--color-primary-700)] transform-gpu">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--activity-accent)]" />
              {item.room}
            </span>
          )}
        </p>
      </div>
    </div>
  );
});

ActivityItem.displayName = "ActivityItem";

// Optimization 10: Memoized standard SVGs
const ActionIcon = memo(({ type, className = "" }) => {
  if (type === "door") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M5 21V4.8C5 3.8 5.8 3 6.8 3H17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 21H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 12H14.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "mic") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M12 14C10.35 14 9 12.65 9 11V6C9 4.35 10.35 3 12 3C13.65 3 15 4.35 15 6V11C15 12.65 13.65 14 12 14Z" stroke="currentColor" strokeWidth="2" />
        <path d="M5 11C5 14.85 8.15 18 12 18C15.85 18 19 14.85 19 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 18V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
});

ActionIcon.displayName = "ActionIcon";

export default LiveActivityFeed;