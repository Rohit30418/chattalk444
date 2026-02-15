import React, { useState, useEffect } from 'react';

const SpeechHud = ({ isSpeaking, transcript }) => {
  const [fillers, setFillers] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [confidence, setConfidence] = useState(100);
  const [startTime, setStartTime] = useState(null);

  // 🎙️ Speech Analytics Logic (Kept exactly as original)
  useEffect(() => {
    if (!transcript) {
      setStartTime(null);
      setWpm(0);
      return;
    }
    if (!startTime) setStartTime(Date.now());
    const words = transcript.trim().toLowerCase().split(/\s+/);
    const lastWord = words[words.length - 1];
    const fillerWords = ['um', 'uh', 'like', 'literally', 'actually', 'so'];
    
    if (fillerWords.includes(lastWord)) {
      setFillers(f => f + 1);
      setConfidence(c => Math.max(15, c - 4)); 
    }
    if (startTime) {
      const minutesPassed = (Date.now() - startTime) / 60000;
      if (minutesPassed > 0) {
        setWpm(Math.round(words.length / minutesPassed));
      }
    }
    const recovery = setTimeout(() => {
      setConfidence(c => Math.min(100, c + 1));
    }, 2000);
    return () => clearTimeout(recovery);
  }, [transcript]);

  return (
    // 🔥 UI UPGRADE: Changed positioning, added glow and tactical borders
    <div className="fixed -top-[100%] -right-[60%] w-80 bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 font-mono z-50 pointer-events-none shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)] overflow-hidden">
      
      {/* Background Scanner Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/20 animate-[scan_4s_linear_infinite]"></div>
      
      {/* 📡 Header: Re-styled for a cleaner "SaaS" look */}
      <div className="flex justify-between items-center mb-6 relative">
        <div className="flex flex-col">
          <span className="text-[10px] text-blue-400 font-black tracking-[0.2em] uppercase">Vocal Analysis</span>
          <span className="text-xs text-white font-bold">Neural Engine v2.0</span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors duration-500 ${isSpeaking ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-rose-500/10 border-rose-500/50 text-rose-400'}`}>
           <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
           <span className="text-[10px] font-black uppercase tracking-widest">{isSpeaking ? 'Active' : 'Standby'}</span>
        </div>
      </div>

      <div className="space-y-6 relative">
        
        {/* 🧠 Confidence Diagnostic Bar: Thicker, rounded, and gradient-heavy */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Communication Integrity</span>
            <span className={`text-sm font-black transition-colors ${confidence > 80 ? 'text-emerald-400' : confidence > 50 ? 'text-amber-400' : 'text-rose-400'}`}>
              {confidence}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
            <div 
              className={`h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)] ${
                confidence > 80 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 
                confidence > 50 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 
                'bg-gradient-to-r from-rose-600 to-rose-400'
              }`} 
              style={{ width: `${confidence}%` }}
            ></div>
          </div>
        </div>

        {/* 📊 Data Grid: Cleaned up spacing and added inner gloss */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col items-center group relative overflow-hidden">
            <span className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-widest">Filler Detect</span>
            <span className={`text-3xl font-black tracking-tighter ${fillers > 5 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
              {fillers.toString().padStart(2, '0')}
            </span>
            <div className="absolute -bottom-2 -right-2 opacity-5 scale-150">
               <i className="fa-solid fa-microphone-slash text-white"></i>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden">
            <span className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-widest">Tempo (WPM)</span>
            <span className="text-3xl font-black tracking-tighter text-blue-400">
              {wpm.toString().padStart(2, '0')}
            </span>
            <div className="absolute -bottom-2 -right-2 opacity-5 scale-150">
               <i className="fa-solid fa-bolt text-white"></i>
            </div>
          </div>
        </div>

        {/* 💬 Real-time Warning Logic: Styled as a tactical message console */}
        <div className={`h-10 flex items-center justify-center rounded-xl border px-4 transition-all duration-300 ${fillers > 4 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-blue-500/5 border-blue-500/10'}`}>
           {fillers > 4 ? (
             <span className="text-[10px] text-rose-400 font-black animate-pulse flex items-center gap-2">
               <i className="fa-solid fa-triangle-exclamation"></i> 
               SYSTEM_ALERT: HIGH_FILLER_FREQUENCY
             </span>
           ) : isSpeaking ? (
             <span className="text-[10px] text-blue-300 font-black flex items-center gap-3 tracking-widest">
               <span className="flex gap-1">
                  <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-duration:1s]"></span>
                  <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.2s]"></span>
                  <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.4s]"></span>
               </span>
               STABLE_INPUT_STREAM
             </span>
           ) : (
             <span className="text-[10px] text-slate-600 font-black tracking-[0.2em]">INITIALIZING_LINK...</span>
           )}
        </div>
      </div>

      {/* Decorative Corner Accents: Thinner and more subtle */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-blue-500/30 rounded-tl-[2rem]"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-purple-500/30 rounded-br-[2rem]"></div>
    </div>
  );
};

export default SpeechHud;