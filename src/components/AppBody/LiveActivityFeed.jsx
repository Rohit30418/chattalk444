import React, { memo } from 'react';

const activities = [
  { id: 1, name: 'Jin', action: 'is speaking in', room: 'Anime Talk', time: 'Just now', icon: 'fa-microphone', tone: 'bg-emerald-500' },
  { id: 2, name: 'John', action: 'created room', room: 'Rap God', time: '1m ago', icon: 'fa-plus', tone: 'bg-sky-500' },
  { id: 3, name: 'Sarah', action: 'joined', room: 'English Cafe', time: '1m ago', icon: 'fa-door-open', tone: 'bg-teal-500' },
  { id: 4, name: 'Raj', action: 'is speaking in', room: 'Anime Talk', time: '2m ago', icon: 'fa-microphone', tone: 'bg-emerald-600' },
  { id: 5, name: 'Mike', action: 'reached Lvl 5', room: '', time: '5m ago', icon: 'fa-fire', tone: 'bg-amber-500' },
];

const LiveActivityFeed = memo(() => {
  return (
    <div className="w-full rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#101626]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
            Happening Now
          </h3>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Recent learner activity
          </p>
        </div>
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
      </div>

      <div className="relative space-y-5 pl-1">
        <div className="absolute bottom-3 left-[15px] top-3 w-px bg-slate-200 dark:bg-white/10" />

        {activities.map((item) => (
          <div key={item.id} className="relative flex gap-3 pl-1">
            <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-white text-white dark:border-[#101626] ${item.tone}`}>
              <i className={`fa-solid ${item.icon} text-[10px]`} aria-hidden="true" />
            </div>

            <div className="min-w-0 pt-0.5">
              <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                {item.time}
              </span>
              <p className="mt-1 text-sm font-medium leading-5 text-slate-600 dark:text-slate-300">
                <span className="font-black text-slate-900 dark:text-white">{item.name}</span>{' '}
                {item.action}
              </p>
              {item.room && (
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                  {item.room}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

LiveActivityFeed.displayName = 'LiveActivityFeed';

export default LiveActivityFeed;
