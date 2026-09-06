import React, { memo, useCallback, useEffect, useState } from 'react';
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

const AiCard = memo(({
  pageName = 'AI Voice Room',
  title = 'Vaani — AI Friend',
  description = 'Practice speaking without pressure. Talk, listen, improve pronunciation, and build confidence.',
}) => {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current === 0 ? 1 : 0));
    }, 6500);

    return () => window.clearInterval(timer);
  }, []);

  const handleTalkNow = useCallback(async (event) => {
    event?.preventDefault();
    event?.stopPropagation();

    const accessCode = String(import.meta.env.VITE_AI_ACCESS_CODE || '').trim();

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
      confirmButtonColor: '#0f766e',
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

    if (password.trim() === accessCode) {
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
  }, [navigate]);

  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-slate-800 bg-[#07111f] shadow-sm">
      <div
        className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${activeSlide * 100}%)` }}
      >
        <section className="relative min-h-[230px] w-full shrink-0 bg-[#07111f] p-5 sm:min-h-[250px] sm:p-6 lg:p-7">
          <div className="relative z-10 flex min-h-[190px] flex-col justify-between gap-6 pr-[35%] sm:pr-[38%]">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-100">
                  <i className="fa-solid fa-robot text-teal-300" aria-hidden="true" />
                  {pageName}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  24/7
                </span>
              </div>

              <h3 className="max-w-[17rem] text-xl font-black leading-tight tracking-tight text-white sm:text-2xl lg:text-3xl">
                {title}
              </h3>
              <p className="mt-2 max-w-[20rem] text-xs font-medium leading-5 text-slate-300 sm:text-sm sm:leading-6">
                {description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pb-3">
              <button
                type="button"
                onClick={handleTalkNow}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-teal-700 shadow-sm transition-colors hover:bg-slate-100 sm:px-5 sm:py-3"
              >
                Talk Now
                <i className="fa-solid fa-microphone-lines text-xs" aria-hidden="true" />
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
            decoding="async"
            fetchPriority="low"
            referrerPolicy="no-referrer"
            className="pointer-events-none absolute bottom-0 right-0 z-10 w-[40%] max-w-[175px] object-contain sm:max-w-[220px] lg:max-w-[250px]"
          />
        </section>

        <section className="relative min-h-[230px] w-full shrink-0 bg-[#0b1717] p-5 sm:min-h-[250px] sm:p-6 lg:p-7">
          <div className="relative z-10 flex min-h-[190px] flex-col justify-between gap-5 pr-0 sm:pr-[34%]">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-200">
                  <i className="fa-solid fa-crown" aria-hidden="true" />
                  Premium Offer
                </span>
                <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-200">
                  Lifetime access
                </span>
              </div>

              <h3 className="max-w-[22rem] text-xl font-black leading-tight tracking-tight text-white sm:text-2xl lg:text-3xl">
                Unlock your full speaking potential.
              </h3>
              <p className="mt-2 max-w-[24rem] text-xs font-medium leading-5 text-slate-300 sm:text-sm sm:leading-6">
                Advanced accent coaching, detailed speaking reports, private practice, and priority AI access.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pb-3">
              <a
                href="/#pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-black text-slate-950 shadow-sm transition-colors hover:bg-amber-200 sm:px-5 sm:py-3"
              >
                Go Premium
                <i className="fa-solid fa-arrow-right text-xs" aria-hidden="true" />
              </a>
              <span className="text-xs font-bold text-slate-400">
                One-time payment
              </span>
            </div>
          </div>

          <div className="pointer-events-none absolute right-6 top-1/2 hidden w-[190px] -translate-y-1/2 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-center sm:block lg:right-8 lg:w-[210px]">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">
              Premium
            </div>
            <div className="mt-2 flex items-end justify-center gap-2">
              <span className="text-4xl font-black tracking-tight text-white lg:text-5xl">$99</span>
              <span className="mb-1 text-sm font-bold text-slate-500 line-through">$299</span>
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-300">
              <i className="fa-solid fa-check" aria-hidden="true" />
              Save $200 today
            </div>
          </div>
        </section>
      </div>

      <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
        {[0, 1].map((index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveSlide(index)}
            aria-label={index === 0 ? 'Show AI Friend' : 'Show Premium offer'}
            aria-current={activeSlide === index ? 'true' : undefined}
            className={`h-1.5 rounded-full transition-[width,background-color] duration-200 ${
              activeSlide === index ? 'w-6 bg-white' : 'w-2 bg-white/35 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
});

AiCard.displayName = 'AiCard';

export default AiCard;
