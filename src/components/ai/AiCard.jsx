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
        {/* LUNA AI */}
        <section className="relative min-h-[250px] w-full shrink-0 overflow-hidden bg-[#07111f] p-5 sm:min-h-[270px] sm:p-6 lg:p-7">
          <div className="relative z-20 flex min-h-[210px] max-w-[62%] flex-col justify-between gap-5 sm:max-w-[58%] lg:max-w-[60%]">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-teal-200">
                  <i className="fa-solid fa-robot" aria-hidden="true" />
                  {pageName}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online 24/7
                </span>
              </div>

              <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-teal-300">
                Meet your speaking partner
              </p>

              <h3 className="max-w-[24rem] text-2xl font-black leading-[1.08] tracking-[-0.035em] text-white sm:text-3xl lg:text-[2.15rem]">
                {title}
              </h3>

              <p className="mt-3 max-w-[26rem] text-xs font-medium leading-5 text-slate-300 sm:text-sm sm:leading-6">
                {description}
              </p>

              <div className="mt-4 hidden flex-wrap gap-2 sm:flex">
                {[
                  ['fa-microphone-lines', 'Voice practice'],
                  ['fa-comment-dots', 'Instant replies'],
                  ['fa-chart-line', 'Pronunciation help'],
                ].map(([icon, label]) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[10px] font-bold text-slate-300"
                  >
                    <i className={`fa-solid ${icon} text-teal-300`} aria-hidden="true" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pb-3">
              <button
                type="button"
                onClick={handleTalkNow}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-black text-white shadow-sm transition-colors hover:bg-teal-400 sm:px-5 sm:py-3"
              >
                Start talking
                <i className="fa-solid fa-microphone-lines text-xs" aria-hidden="true" />
              </button>

              <span className="hidden items-center gap-2 text-[11px] font-semibold text-slate-400 sm:inline-flex">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.06] text-[9px] text-teal-300">
                  <i className="fa-solid fa-cube" aria-hidden="true" />
                </span>
                Voice + 3D avatar
              </span>
            </div>
          </div>

          {/* Lightweight visual panel - no blur or continuous animation */}
          <div className="absolute inset-y-4 right-4 z-10 hidden w-[35%] overflow-hidden rounded-[1.3rem] border border-white/10 bg-[#0b1b29] sm:block lg:w-[34%]">
            <div className="absolute left-4 top-4 z-20 rounded-xl border border-teal-300/20 bg-[#0c2529] px-3 py-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-teal-200">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />
                Live coaching
              </div>
              <div className="mt-2 flex items-end gap-1" aria-hidden="true">
                {[8, 14, 20, 11, 17, 9].map((height, index) => (
                  <span
                    key={`${height}-${index}`}
                    className="w-1 rounded-full bg-teal-300/80"
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
            </div>

            <div className="absolute bottom-4 left-4 z-20 rounded-xl border border-white/10 bg-[#0a1722]/95 px-3 py-2 text-left">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                Luna can help with
              </p>
              <p className="mt-1 text-[11px] font-bold text-white">
                Interviews · fluency · confidence
              </p>
            </div>
          </div>

          <img
            src={AVATAR_URL}
            alt="Luna AI speaking coach"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            referrerPolicy="no-referrer"
            className="pointer-events-none absolute bottom-0 right-0 z-10 w-[42%] max-w-[185px] object-contain sm:right-[1.5%] sm:w-[31%] sm:max-w-[240px] lg:max-w-[270px]"
          />

          <div className="pointer-events-none absolute bottom-0 left-0 h-1 w-full bg-teal-500/70" />
        </section>

        {/* PREMIUM */}
        <section className="relative min-h-[250px] w-full shrink-0 bg-[#0b1717] p-5 sm:min-h-[270px] sm:p-6 lg:p-7">
          <div className="relative z-10 flex min-h-[210px] flex-col justify-between gap-5 pr-0 sm:pr-[34%]">
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
