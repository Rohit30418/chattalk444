import React, { memo, useState } from 'react';

const face = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=80&h=80&q=82`;

const activities = [
  { id: 1, name: 'Raj', action: 'is speaking in', room: 'Anime Talk', time: '2 min ago', photoURL: face('photo-1507591064344-4c6ce005b128') },
  { id: 2, name: 'Sarah', action: 'joined', room: 'English Cafe', time: '5 min ago', photoURL: face('photo-1531123897727-8f129e1688ce') },
  { id: 3, name: 'John', action: 'created a room', room: 'Rap God', time: '9 min ago', photoURL: face('photo-1500648767791-00dcc994a43e') },
  { id: 4, name: 'Mike', action: 'reached Level 5', room: '', time: '28 min ago', photoURL: face('photo-1506794778202-cad84cf45f1d') },
];

const ActivityAvatar = ({ item }) => {
  const [failed, setFailed] = useState(false);

  if (item.photoURL && !failed) {
    return (
      <img
        src={item.photoURL}
        alt={item.name}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover dark:border-white/10"
      />
    );
  }

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-black text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
      {item.name?.charAt(0)?.toUpperCase() || 'V'}
    </span>
  );
};

const LiveActivityFeed = memo(() => {
  return (
    <section className="mt-6 rounded-[1.6rem] border border-teal-100 bg-teal-50/60 p-4 dark:border-teal-400/10 dark:bg-teal-500/[0.05] sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
            <i className="fa-solid fa-bolt text-sm" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight text-slate-950 dark:text-white sm:text-lg">Happening Now</h3>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Live activity from the Vaani community</p>
          </div>
        </div>
        <span className="hidden items-center gap-2 text-[11px] font-black text-teal-700 dark:text-teal-300 sm:inline-flex">
          Live community <span className="h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-4 lg:overflow-visible">
        {activities.map((item) => (
          <div key={item.id} className="flex min-w-[230px] items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-white/10 dark:bg-[#101626] lg:min-w-0">
            <ActivityAvatar item={item} />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="font-black text-slate-950 dark:text-white">{item.name}</span> {item.action}
              </p>
              {item.room && <p className="mt-0.5 truncate text-[11px] font-bold text-teal-700 dark:text-teal-300">{item.room}</p>}
              <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

LiveActivityFeed.displayName = 'LiveActivityFeed';

export default LiveActivityFeed;
