import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AppWrapper';
import useMobilePwaMode from '../../hooks/useMobilePwaMode';

const SESSION_KEY = 'vaani-pwa-launch-ad-seen';

const PROMOTIONS = [
  {
    category: 'practice',
    eyebrow: 'Featured practice',
    title: 'Speak more. Overthink less.',
    text: 'Jump into a live room and practice naturally with learners around the world.',
    cta: 'Explore rooms',
    to: '/rooms',
    icon: 'fa-microphone-lines',
  },
  {
    category: 'community',
    eyebrow: 'Meet your people',
    title: 'Find a language buddy today.',
    text: 'Connect, follow and start private conversations with people learning like you.',
    cta: 'Discover people',
    to: '/connect',
    icon: 'fa-user-group',
  },
  {
    category: 'ai',
    eyebrow: 'Vaani premium',
    title: 'Practice privately with Luna AI.',
    text: 'Get speaking practice, feedback and confidence-building sessions whenever you want.',
    cta: 'Meet Luna',
    to: '/aiBot',
    icon: 'fa-wand-magic-sparkles',
  },
];

const PwaLaunchAd = () => {
  const isMobilePwa = useMobilePwaMode();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  const promotion = useMemo(() => {
    const index = Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % PROMOTIONS.length;
    return PROMOTIONS[index];
  }, []);

  useEffect(() => {
    if (!isMobilePwa || user?.isMember === true) {
      setVisible(false);
      return undefined;
    }

    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      return undefined;
    }

    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(true);
    setProgress(100);

    const startedAt = Date.now();
    const duration = 6000;

    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setProgress(Math.max(0, 100 - ((elapsed / duration) * 100)));
    }, 100);

    const closeTimer = window.setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(closeTimer);
    };
  }, [isMobilePwa, user?.isMember]);

  if (!visible) return null;

  const close = () => setVisible(false);

  return (
    <div className="fixed inset-0 z-[500] flex min-h-[100dvh] flex-col bg-[#041311] text-white">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(circle at 15% 10%, rgba(45,212,191,.26), transparent 34%), radial-gradient(circle at 90% 40%, rgba(14,116,144,.25), transparent 38%), linear-gradient(155deg,#041311 0%,#06252a 48%,#071b2c 100%)',
        }}
      />

      <div className="relative z-10 flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-teal-100">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />
          Featured · {promotion.category}
        </div>

        <button
          type="button"
          onClick={close}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white backdrop-blur"
        >
          Skip
        </button>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-10 text-center">
        <div className="mb-7 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-[0_28px_80px_rgba(45,212,191,.22)]">
          <img src="/vaani-icon.svg" alt="Vaani" className="h-full w-full" />
        </div>

        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-teal-200">
          {promotion.eyebrow}
        </p>
        <h2 className="mt-3 max-w-sm text-4xl font-black tracking-[-0.05em] text-white">
          {promotion.title}
        </h2>
        <p className="mt-4 max-w-sm text-sm font-semibold leading-6 text-slate-300">
          {promotion.text}
        </p>

        <Link
          to={promotion.to}
          onClick={close}
          className="mt-8 inline-flex min-w-48 items-center justify-center gap-2 rounded-2xl bg-teal-400 px-5 py-3.5 text-sm font-black text-[#041311] shadow-[0_14px_40px_rgba(45,212,191,.22)]"
        >
          <i className={`fa-solid ${promotion.icon}`} aria-hidden="true" />
          {promotion.cta}
        </Link>

        <p className="mt-5 text-[10px] font-bold text-slate-500">
          Vaani members enjoy an ad-free app experience.
        </p>
      </div>

      <div className="relative z-10 h-1 bg-white/10">
        <div
          className="h-full bg-teal-300 transition-[width] duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default PwaLaunchAd;
