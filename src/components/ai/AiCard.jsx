import React from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const AVATAR_URL =
  'https://static.vecteezy.com/system/resources/previews/034/599/439/non_2x/ai-generated-3d-cute-cartoon-woman-character-in-blue-suit-on-transparent-background-png.png';

const getTheme = () => {
  const isDark = document.documentElement.classList.contains('dark');

  return {
    background: isDark ? '#0f172a' : '#ffffff',
    color: isDark ? '#f8fafc' : '#0f172a',
  };
};

const AiCard = ({
  pageName = 'AI Voice Room',
  title = 'Vanni — AI Friend',
  description = 'Practice speaking without pressure. Talk, listen, improve pronunciation, and build confidence.',
}) => {
  const navigate = useNavigate();

  const handleTalkNow = async () => {
    const accessCode = import.meta.env.VITE_AI_ACCESS_CODE || '';

    // Client-side access codes are not real security. Keep empty in production
    // or move access control to backend/subscription middleware.
    if (!accessCode) {
      navigate('/ai-bot');
      return;
    }

    const theme = getTheme();

    const { value: password } = await Swal.fire({
      title: 'Unlock AI Room',
      text: 'Enter your access code to continue.',
      input: 'password',
      inputPlaceholder: 'Access code',
      showCancelButton: true,
      confirmButtonText: 'Continue',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#ef4444',
      background: theme.background,
      color: theme.color,
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl',
        cancelButton: 'rounded-xl',
      },
    });

    if (!password) return;

    if (password === accessCode) {
      navigate('/ai-bot');
      return;
    }

    Swal.fire({
      icon: 'error',
      title: 'Access denied',
      text: 'The access code is incorrect.',
      timer: 1500,
      showConfirmButton: false,
      background: theme.background,
      color: theme.color,
      customClass: { popup: 'rounded-2xl' },
    });
  };

  return (
    <section className="group relative h-full min-h-[230px] overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#070b18] p-5 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl sm:min-h-[260px] sm:p-6 lg:p-7">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0b1020] to-indigo-950" />
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl transition-opacity duration-500 group-hover:opacity-90" />
      <div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />

      <div className="relative z-10 flex h-full min-h-[200px] flex-col justify-between gap-6 pr-[34%] sm:pr-[38%]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-100 backdrop-blur-md">
              <i className="fa-solid fa-robot text-blue-300" />
              {pageName}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              24/7
            </span>
          </div>

          <h3 className="max-w-[16rem] text-xl font-black leading-tight tracking-tight text-white sm:text-2xl lg:text-3xl">
            {title}
          </h3>

          <p className="mt-2 max-w-[19rem] text-xs font-medium leading-5 text-slate-300 sm:text-sm sm:leading-6">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTalkNow}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-indigo-700 shadow-lg shadow-blue-500/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-500/25 active:scale-[0.98] sm:px-5 sm:py-3"
          >
            Talk Now
            <i className="fa-solid fa-microphone-lines text-xs" />
          </button>

          <span className="hidden text-[11px] font-semibold text-slate-500 sm:inline">
            Voice + 3D avatar
          </span>
        </div>
      </div>

      <img
        src={AVATAR_URL}
        alt="AI avatar"
        loading="lazy"
        referrerPolicy="no-referrer"
        className="pointer-events-none absolute bottom-0 right-0 z-20 w-[42%] max-w-[180px] object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-1 sm:max-w-[230px] lg:max-w-[260px]"
      />

      <div className="pointer-events-none absolute inset-0 rounded-[1.6rem] ring-1 ring-inset ring-white/10" />
    </section>
  );
};

export default AiCard;
