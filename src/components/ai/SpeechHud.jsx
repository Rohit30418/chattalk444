import React, { useMemo } from 'react';

const FILLER_WORDS = new Set(['um', 'uh', 'like', 'literally', 'actually', 'so', 'basically', 'you', 'know']);

const stateCopy = {
  idle: 'Ready when you are',
  listening: 'Listening to your speech',
  thinking: 'Preparing a response',
  speaking: 'Luna is replying',
  paused: 'Microphone paused',
  error: 'Needs attention',
};

const SpeechHud = ({ isSpeaking, transcript, state = 'idle' }) => {
  const stats = useMemo(() => {
    const clean = String(transcript || '').trim().toLowerCase();

    if (!clean) {
      return {
        words: 0,
        fillers: 0,
        confidence: 100,
        wpm: 0,
      };
    }

    const words = clean.split(/\s+/).filter(Boolean);
    const fillers = words.filter((word) => FILLER_WORDS.has(word.replace(/[^\w]/g, ''))).length;
    const confidence = Math.max(25, Math.min(100, 100 - fillers * 6));
    const estimatedMinutes = Math.max(0.1, words.length / 135);
    const wpm = Math.round(words.length / estimatedMinutes);

    return {
      words: words.length,
      fillers,
      confidence,
      wpm,
    };
  }, [transcript]);

  const progressClass = stats.confidence > 80
    ? 'bg-emerald-400'
    : stats.confidence > 55
      ? 'bg-amber-400'
      : 'bg-rose-400';

  const scoreClass = stats.confidence > 80
    ? 'text-emerald-300'
    : stats.confidence > 55
      ? 'text-amber-300'
      : 'text-rose-300';

  return (
    <section className="w-full rounded-[1.5rem] border border-white/10 bg-[#0b1220]/95 p-5 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-300">
              <i className="fa-solid fa-chart-simple text-xs" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-teal-300">
                Session insights
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                {stateCopy[state] || 'Voice practice'}
              </p>
            </div>
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${
            isSpeaking
              ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
              : 'border-white/10 bg-white/[0.04] text-slate-400'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isSpeaking ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          {isSpeaking ? 'Live' : 'Standby'}
        </span>
      </div>

      <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
              Clarity
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              Based on filler-word usage
            </p>
          </div>
          <span className={`text-2xl font-black tracking-tight ${scoreClass}`}>
            {stats.confidence}%
          </span>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${progressClass}`}
            style={{ width: `${stats.confidence}%` }}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Metric icon="fa-message" label="Words" value={stats.words} />
        <Metric icon="fa-filter-circle-xmark" label="Fillers" value={stats.fillers} warn={stats.fillers > 4} />
        <Metric icon="fa-gauge-high" label="WPM" value={stats.wpm} accent />
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-white/[0.07] pt-4 text-[10px] font-semibold text-slate-500">
        <i className="fa-solid fa-shield-halved text-teal-400" aria-hidden="true" />
        Live feedback stays inside this practice session.
      </div>
    </section>
  );
};

const Metric = ({ icon, label, value, warn = false, accent = false }) => (
  <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3">
    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.11em] text-slate-500">
      <i className={`fa-solid ${icon} text-[8px]`} aria-hidden="true" />
      <span>{label}</span>
    </div>
    <p className={`mt-2 text-xl font-black tracking-tight ${
      warn ? 'text-rose-300' : accent ? 'text-sky-300' : 'text-white'
    }`}>
      {value}
    </p>
  </div>
);

export default SpeechHud;
