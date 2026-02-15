import React from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Using the specific 3D avatar image from your design reference
// Replace with your local path if needed, e.g., "/assets/3d-avatar.png"
const AVATAR_URL = "https://static.vecteezy.com/system/resources/previews/034/599/439/non_2x/ai-generated-3d-cute-cartoon-woman-character-in-blue-suit-on-transparent-background-png.png"; 

const AiCard = ({ pageName, title, description }) => {
  const navigate = useNavigate();

  const handleTalkNow = async () => {
    const { value: password } = await Swal.fire({
      title: 'Authentication Required',
      text: 'Enter access code to chat with AI',
      input: 'password',
      inputPlaceholder: 'Enter PIN (1178)',
      showCancelButton: true,
      confirmButtonText: 'Unlock',
      confirmButtonColor: 'var(--color-primary, #4f46e5)',
      cancelButtonColor: '#ef4444',
      background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff',
      color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
      customClass: { popup: 'rounded-2xl' }
    });

    if (password === '1178') {
      navigate('/aiBot');
    } else if (password) {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'Incorrect password entered.',
        timer: 1500,
        showConfirmButton: false,
        background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff',
        color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
        customClass: { popup: 'rounded-2xl' }
      });
    }
  };

  return (
    // The card container should span 2 columns in the parent grid (handled in HomeBody)
    <div className="relative h-full min-h-[280px] group overflow-hidden rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      
      {/* --- Background & Gradients --- */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0B0C15] to-slate-900 dark:from-indigo-950 dark:via-[#0f111a] dark:to-[#0B0C15] transition-colors duration-300"></div>
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/40 via-transparent to-transparent blur-2xl group-hover:opacity-50 transition-opacity duration-500"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-colors duration-500"></div>
      
      {/* --- Content Wrapper --- */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        
        {/* Header & Text */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/10 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/50 backdrop-blur-md">
              <i className="fa-solid fa-robot text-primary text-sm"></i>
              <span className="text-xs font-bold text-white uppercase tracking-wider">{pageName || "AI Voice Room"}</span>
            </div>
            <i className="fa-solid fa-lock text-slate-500 dark:text-slate-600 text-lg group-hover:text-primary transition-colors"></i>
          </div>

          <h3 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
            {title || "Luna — AI Friend"}
          </h3>
          <p className="text-slate-300 dark:text-slate-400 text-sm md:text-base font-medium max-w-[60%] leading-relaxed">
            {description || "Practice speaking without pressure. Luna is here to listen 24/7."}
          </p>
        </div>

        {/* Button */}
        <div>
          <button
            onClick={handleTalkNow}
            className="px-8 py-3.5 bg-white text-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 group/btn"
          >
            Talk Now 
            <i className="fa-solid fa-microphone-lines animate-pulse group-hover/btn:rotate-12 transition-transform"></i>
          </button>
        </div>
      </div>

      {/* --- 3D Avatar Image --- */}
      {/* Positioned absolutely to the right, outside the flex flow */}
      <img
        src={AVATAR_URL}
        alt="AI Character"
        className="absolute bottom-0 right-0 w-2/5 max-w-[220px] md:max-w-[280px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] group-hover:scale-105 group-hover:-rotate-2 transition-all duration-500 z-20"
      />
    </div>
  );
};

export default AiCard;