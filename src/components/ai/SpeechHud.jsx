import React, { useMemo } from 'react';

const FILLER_WORDS = new Set(['um', 'uh', 'like', 'literally', 'actually', 'so', 'basically', 'you', 'know']);

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

  const confidenceTone = stats.confidence > 80
    ? 'text-emerald-300 from-emerald-500 to-emerald-300'
    : stats.confidence > 55
      ? 'text-amber-300 from-amber-500 to-amber-300'
      : 'text-rose-300 from-rose-500 to-rose-300';

  return (
    <section className="w-full rounded-[1.25rem] border border-white/10 bg-[#070b18]/75 p-3 shadow-2xl backdrop-blur-2xl sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">
            Vocal analysis
          </p>
          <p className="truncate text-xs font-semibold text-slate-500">
            {state === 'listening' ? 'Listening to your speech' : state === 'speaking' ? 'AI is replying' : 'Session monitor'}
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
            isSpeaking
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
              : 'border-slate-400/20 bg-white/5 text-slate-400'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          {isSpeaking ? 'Active' : 'Standby'}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Clarity score
            </span>
            <span className={`text-xs font-black ${confidenceTone.split(' ')[0]}`}>
              {stats.confidence}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${confidenceTone.replace(confidenceTone.split(' ')[0], '')} transition-all duration-500`}
              style={{ width: `${stats.confidence}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">Words</p>
            <p className="mt-1 text-lg font-black text-white">{stats.words}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">Fillers</p>
            <p className={`mt-1 text-lg font-black ${stats.fillers > 4 ? 'text-rose-300' : 'text-white'}`}>
              {stats.fillers}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">WPM</p>
            <p className="mt-1 text-lg font-black text-blue-300">{stats.wpm}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpeechHud;
