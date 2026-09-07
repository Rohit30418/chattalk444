import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from './AppWrapper';
import GradientSpinner from '../common/GradientSpinner';

const MemberRoute = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState('checking');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const verifyMembership = async () => {
      if (!user?.uid) {
        setStatus('signed-out');
        return;
      }

      setStatus('checking');

      try {
        const { data } = await api.get(`/api/users/${encodeURIComponent(user.uid)}`);
        if (cancelled) return;

        const isMember = data?.isMember === true;
        setStatus(isMember ? 'allowed' : 'blocked');

        if (isMember !== (user?.isMember === true)) {
          refreshUser?.();
        }
      } catch (error) {
        if (cancelled) return;

        if (error?.response?.status === 404) {
          setStatus('blocked');
          return;
        }

        console.error('Membership verification failed:', error);
        setStatus('error');
      }
    };

    verifyMembership();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, retryKey]);

  const retry = useCallback(() => {
    setRetryKey((value) => value + 1);
  }, []);

  if (status === 'checking') {
    return <GradientSpinner />;
  }

  if (status === 'allowed') {
    return children;
  }

  const signedOut = status === 'signed-out';
  const failed = status === 'error';

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#050713] px-4 py-10 text-white">
      <div className="w-full max-w-lg rounded-[1.75rem] border border-white/10 bg-[#0b1220] p-6 shadow-lg sm:p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-400/10 text-teal-300">
          <i
            className={`fa-solid ${failed ? 'fa-triangle-exclamation' : signedOut ? 'fa-user-lock' : 'fa-crown'} text-xl`}
            aria-hidden="true"
          />
        </div>

        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
          Vaani AI Access
        </p>

        <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
          {failed
            ? 'We could not verify your membership.'
            : signedOut
              ? 'Sign in to use Luna AI.'
              : 'Membership required for Luna AI.'}
        </h1>

        <p className="mt-3 text-sm font-medium leading-6 text-slate-400">
          {failed
            ? 'Please try again. Your account has not been charged or changed.'
            : signedOut
              ? 'Luna AI is available to signed-in Vaani members. Sign in first, then open the AI voice coach again.'
              : 'Your account does not currently have an active Vaani membership. Choose a membership plan to unlock AI voice practice, pronunciation coaching, and the 3D Luna session.'}
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {failed ? (
            <button
              type="button"
              onClick={retry}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 text-sm font-black text-slate-950 transition-colors hover:bg-teal-400"
            >
              <i className="fa-solid fa-rotate-right text-xs" aria-hidden="true" />
              Try again
            </button>
          ) : (
            <Link
              to="/#pricing"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 text-sm font-black text-slate-950 transition-colors hover:bg-teal-400"
            >
              <i className="fa-solid fa-crown text-xs" aria-hidden="true" />
              View membership plans
            </Link>
          )}

          <Link
            to="/rooms"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-slate-200 transition-colors hover:bg-white/[0.08]"
          >
            <i className="fa-solid fa-arrow-left text-xs" aria-hidden="true" />
            Back to rooms
          </Link>
        </div>

        {!signedOut && !failed && (
          <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-xs font-semibold leading-5 text-slate-500">
            Already paid? Refresh your account after your membership is activated and try again.
          </div>
        )}
      </div>
    </main>
  );
};

export default MemberRoute;
