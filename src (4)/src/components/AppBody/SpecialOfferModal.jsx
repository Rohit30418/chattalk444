import React, { useState, useEffect } from 'react';

const SpecialOfferModal = ({ onClose }) => {
  const [timeLeft, setTimeLeft] = useState({ m: 59, s: 28, ms: 22 });

  // 1. Millisecond Countdown Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { m, s, ms } = prev;
        if (ms > 0) {
          ms--;
        } else {
          ms = 99;
          if (s > 0) {
            s--;
          } else {
            s = 59;
            if (m > 0) m--;
          }
        }
        return { m, s, ms };
      });
    }, 10);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Main Card */}
      <div className="relative w-full max-w-sm bg-white dark:bg-[#151725] rounded-[2.5rem] p-6 text-center shadow-2xl animate-bounce-in border-4 border-white/20 dark:border-slate-700/50">
        
        {/* --- FLOATING 3D TROPHY (Top Center) --- */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 z-20 pointer-events-none">
           <img 
             src="https://cdn3d.iconscout.com/3d/premium/thumb/trophy-cup-5353844-4483785.png" 
             alt="Winner Trophy" 
             className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-float"
           />
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-white transition-colors flex items-center justify-center"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        {/* Content */}
        <div className="mt-20">
          <div className="inline-block px-4 py-1.5 bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 text-[10px] font-black rounded-full mb-4 uppercase tracking-widest shadow-sm">
             🎉 9th Anniversary Special
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 leading-none tracking-tight">
            You hit the <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 drop-shadow-sm">JACKPOT!</span>
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-6 px-4 leading-relaxed">
            You've surpassed <strong>90% of users</strong>! Unlock unlimited rooms and AI access forever.
          </p>

          {/* Pricing Box */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border-2 border-dashed border-slate-200 dark:border-slate-700/60 mb-6 relative overflow-hidden group">
             <div className="relative z-10 flex flex-col items-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Lifetime Plan</p>
                <div className="flex items-center justify-center gap-3">
                   <span className="text-slate-400 line-through text-lg font-bold decoration-2 decoration-red-400">$199</span>
                   <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">$99</span>
                </div>
             </div>
          </div>

          {/* Timer Row */}
          <div className="flex items-center justify-center gap-2 mb-6">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Ends in:</span>
             
             {/* Timer Blocks */}
             <div className="flex gap-1.5">
               {['59', String(timeLeft.s).padStart(2, '0'), String(timeLeft.ms).padStart(2, '0')].map((num, i) => (
                 <div key={i} className="bg-slate-900 dark:bg-black text-white px-2 py-1.5 rounded-lg text-sm font-mono font-bold shadow-lg border border-slate-700">
                    {num}
                 </div>
               ))}
             </div>
          </div>

          {/* GRAB NOW Button with Shine */}
          <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF0F7B] to-[#F89B29] text-white font-black text-xl shadow-[0_10px_40px_-10px_rgba(255,15,123,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group">
             <span className="relative z-10 flex items-center justify-center gap-2">
               GRAB NOW <i className="fa-solid fa-arrow-right text-sm"></i>
             </span>
             {/* Shine Animation */}
             <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-shine"></div>
          </button>
          
          <p className="text-[10px] text-slate-400 mt-4 underline cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">
            No thanks, I hate saving money
          </p>
        </div>
      </div>
    </div>
  );
};

export default SpecialOfferModal;