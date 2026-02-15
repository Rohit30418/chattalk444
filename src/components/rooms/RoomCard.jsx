import React from 'react';
import { Link } from 'react-router-dom';

const RoomCard = ({ roomdata }) => {
  if (!roomdata) return null;

  // --- SAFE DEFAULTS ---
  const id = roomdata.id;
  const title = roomdata.Title || "Untitled Room";
  const language = roomdata.Language || "Global";
  const level = roomdata.Level || "All Levels";
  const activeCount = Number(roomdata.participantsCount) || 0;
  const maxPeople = Number(roomdata.MaximumPeople) || 5;
  const isFull = activeCount >= maxPeople;
  
  // Choose a color theme based on level/index for the waveform
  const themeColor = getThemeColor(level);

  return (
    <div className="group relative min-h-[230px] bg-[#181920] border border-white/5 hover:border-indigo-500/30 rounded-[24px] p-5 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40">
      
      {/* --- 1. HEADER ROW --- */}
      <div className="flex justify-between items-start z-10">
        <div className="flex items-center gap-2">
           {/* Flag & Lang */}
           <div className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg bg-white/5 border border-white/5">
              <img 
                 src={`https://flagsapi.com/${getFlagCode(language)}/flat/64.png`} 
                 className="w-3.5 h-3.5 object-contain" 
                 alt={language}
                 onError={(e) => e.target.style.display = 'none'}
              />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{language}</span>
           </div>

           {/* Level Tag */}
           <div className={`px-2 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${getLevelStyle(level)}`}>
              {level.replace("#", "")}
           </div>
        </div>

        {/* Live Badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.15)]">
           <span className="relative flex h-1.5 w-1.5">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
           </span>
           <span className="text-[9px] text-rose-400 font-bold tracking-widest">LIVE</span>
        </div>
      </div>

      {/* --- 2. TITLE --- */}
      <div className="z-10 mt-1">
        {isFull && <span className="text-[10px] font-bold text-rose-400 mb-1 block uppercase tracking-wide">Room Full</span>}
        <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 group-hover:text-indigo-200 transition-colors">
            {title}
        </h3>
      </div>

      {/* --- 3. BOTTOM ROW (Avatars + Action) --- */}
      <div className="flex items-end justify-between z-10 mt-auto mb-2">
         {/* Avatars */}
         <div className="flex -space-x-3">
            {[...Array(Math.min(activeCount, 4))].map((_, i) => (
                <div key={i} className="w-9 h-9 rounded-full bg-slate-800 border-[3px] border-[#181920] overflow-hidden">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${id}-${i}`} 
                      alt="User" 
                      className="w-full h-full object-cover"
                    />
                </div>
            ))}
            {activeCount > 4 && (
                <div className="w-9 h-9 rounded-full bg-slate-700 border-[3px] border-[#181920] flex items-center justify-center text-[10px] text-white font-bold">
                    +{activeCount - 4}
                </div>
            )}
            
            {/* Add Button if empty */}
            {activeCount === 0 && (
                <div className="w-9 h-9 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500">
                   <i className="fa-solid fa-plus text-xs"></i>
                </div>
            )}
         </div>

         {/* Right Side Text */}
         <div className="text-right">
             {isFull ? (
                 <span className="text-xs font-bold text-rose-500">Room Full</span>
             ) : (
                <Link to={`/room/${id}`}>
                   <button className="px-4 py-1.5 rounded-lg bg-white text-[#181920] text-[10px] font-black uppercase tracking-wider hover:bg-indigo-50 transition-colors shadow-lg shadow-white/10">
                      Join
                   </button>
                </Link>
             )}
         </div>
      </div>

    </div>
  );
};

// --- Helper Functions ---

const getFlagCode = (lang) => {
    const map = { "English": "US", "Hindi": "IN", "Spanish": "ES", "Japanese": "JP", "French": "FR", "German": "DE", "Portuguese": "PT", "Urdu": "PK" };
    return map[lang] || "US";
};

const getLevelStyle = (level) => {
    const l = level?.toLowerCase() || "";
    if (l.includes("intermediate")) return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"; // Green
    if (l.includes("advanced")) return "bg-amber-500/10 border-amber-500/30 text-amber-400"; // Yellow/Orange
    if (l.includes("beginner")) return "bg-blue-500/10 border-blue-500/30 text-blue-400"; // Blue
    return "bg-slate-700/50 border-slate-600 text-slate-400";
};

const getThemeColor = (level) => {
    const l = level?.toLowerCase() || "";
    if (l.includes("intermediate")) return "bg-gradient-to-t from-emerald-600 to-emerald-400";
    if (l.includes("advanced")) return "bg-gradient-to-t from-amber-600 to-amber-400";
    return "bg-gradient-to-t from-indigo-600 to-purple-400"; // Default Purple/Pink
};

export default RoomCard;