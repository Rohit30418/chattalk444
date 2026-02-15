import React, { useState } from 'react';

const AnniversaryCard = ({ onClick }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 animate-slide-up hidden md:block">
      {/* Close Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
        className="absolute -top-2 -right-2 bg-white text-black w-6 h-6 rounded-full text-xs font-bold shadow-md z-50 hover:bg-gray-100 flex items-center justify-center"
      >
        ✕
      </button>

      {/* Main Card */}
      <div 
        onClick={onClick}
        className="relative w-64 bg-gradient-to-br from-[#4a00e0] to-[#8e2de2] rounded-3xl p-5 shadow-2xl cursor-pointer hover:scale-105 transition-transform group border border-white/20"
      >
        {/* Confetti Background (Simple dots) */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fff 2px, transparent 2px)', backgroundSize: '12px 12px' }}></div>

        {/* Content */}
        <div className="relative z-10 text-center">
            <div className="text-yellow-300 font-black text-lg leading-none mb-1 drop-shadow-md">
                9th Anniversary
            </div>
            <div className="text-white font-bold text-xl mb-3 tracking-tight">
                Big Sale
            </div>

            <div className="bg-white rounded-xl p-3 shadow-lg transform rotate-[-2deg] mb-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Lifetime Unlimited</p>
                <div className="flex items-center justify-center gap-1 text-slate-900 font-black text-2xl">
                    Only <span className="text-[#e11d48]">$79</span>
                </div>
            </div>

            <button className="w-full bg-[#ccff00] hover:bg-white text-black font-black py-2 rounded-full text-sm shadow-lg shadow-black/20 uppercase tracking-wider transition-colors">
                GRAB NOW
            </button>
        </div>

        {/* 3D Element Decor (Optional - CSS Shape for now) */}
        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-pink-500 rounded-full blur-xl opacity-60"></div>
      </div>
    </div>
  );
};

export default AnniversaryCard;