import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import AiTextToSpeech from './AiTextToSpeech';
import SpeechHud from './SpeechHud';

const STATE = {
  IDLE: 'idle',
  LISTENING: 'listening',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
  PAUSED: 'paused',
  ERROR: 'error',
};

const SILENCE_TIMEOUT_MS = 1100;

export default function VoiceRecognition({ onMouthLevel }) {
  const [state, setState] = useState(STATE.IDLE);
  const [transcript, setTranscript] = useState('');
  const [botText, setBotText] = useState('');
  const [error, setError] = useState('');

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const stateRef = useRef(STATE.IDLE);
  const micStreamRef = useRef(null);
  const aiAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const analyserRef = useRef(null);
  const mouthRafRef = useRef(null);
  const mountedRef = useRef(true);
  const finalTranscriptRef = useRef('');
  const recognitionActiveRef = useRef(false);

  const navigate = useNavigate();

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopBrowserMic = useCallback(() => {
    try {
      micStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    } catch {}

    micStreamRef.current = null;
  }, []);

  const stopMouthAnalysis = useCallback(async () => {
    if (mouthRafRef.current) {
      cancelAnimationFrame(mouthRafRef.current);
      mouthRafRef.current = null;
    }

    try { sourceRef.current?.disconnect?.(); } catch {}
    try { analyserRef.current?.disconnect?.(); } catch {}

    sourceRef.current = null;
    analyserRef.current = null;

    onMouthLevel?.(0);
  }, [onMouthLevel]);

  const stopAiAudio = useCallback(async () => {
    await stopMouthAnalysis();

    try {
      aiAudioRef.current?.pause?.();
      if (aiAudioRef.current) aiAudioRef.current.src = '';
    } catch {}

    aiAudioRef.current = null;
  }, [stopMouthAnalysis]);

  const stopRecognition = useCallback(() => {
    clearSilenceTimer();

    try {
      recognitionActiveRef.current = false;
      recognitionRef.current?.stop?.();
    } catch {}

    stopBrowserMic();
  }, [clearSilenceTimer, stopBrowserMic]);

  const closeAudioContext = useCallback(async () => {
    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
      }
    } catch {}

    audioContextRef.current = null;
  }, []);

  const getOrbColor = () => {
    switch (state) {
      case STATE.LISTENING:
        return 'from-emerald-400 to-cyan-400';
      case STATE.THINKING:
        return 'from-amber-400 to-orange-500';
      case STATE.SPEAKING:
        return 'from-indigo-500 to-purple-600';
      case STATE.PAUSED:
        return 'from-rose-500 to-red-600';
      case STATE.ERROR:
        return 'from-red-500 to-rose-700';
      default:
        return 'from-slate-500 to-slate-700';
    }
  };

  const playAudioWithAnalysis = useCallback(async (url) => new Promise(async (resolve) => {
    if (!url) {
      onMouthLevel?.(0);
      resolve();
      return;
    }

    await stopAiAudio();

    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';
    aiAudioRef.current = audio;

    let rafId = null;

    const cleanup = async () => {
      if (rafId) cancelAnimationFrame(rafId);
      await stopMouthAnalysis();
      resolve();
    };

    try {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;

      if (!AudioContextCtor) {
        audio.onended = cleanup;
        audio.onerror = cleanup;
        await audio.play();
        return;
      }

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContextCtor();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.65;

      source.connect(analyser);
      analyser.connect(ctx.destination);

      sourceRef.current = source;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMouth = () => {
        if (!mountedRef.current || audio.paused || audio.ended) {
          onMouthLevel?.(0);
          return;
        }

        analyser.getByteFrequencyData(dataArray);

        const avg = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const level = Math.min(1, avg / 65);

        onMouthLevel?.(level);
        rafId = requestAnimationFrame(updateMouth);
        mouthRafRef.current = rafId;
      };

      audio.onended = cleanup;
      audio.onerror = cleanup;

      await audio.play();
      updateMouth();
    } catch (err) {
      console.error('[VoiceRecognition audio]', err);

      try {
        audio.onended = cleanup;
        audio.onerror = cleanup;
        await audio.play();
      } catch {
        cleanup();
      }
    }
  }), [onMouthLevel, stopAiAudio, stopMouthAnalysis]);

  const startListening = useCallback(async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      setState(STATE.ERROR);
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = import.meta.env.VITE_SPEECH_LANG || 'en-US';

      recognition.onstart = () => {
        recognitionActiveRef.current = true;
      };

      recognition.onend = () => {
        recognitionActiveRef.current = false;
      };

      recognition.onerror = (event) => {
        if (event.error === 'aborted' || event.error === 'no-speech') return;

        setError(`Microphone error: ${event.error}`);
        setState(STATE.ERROR);
      };

      recognition.onresult = (event) => {
        if (stateRef.current !== STATE.LISTENING) return;

        let interim = '';
        let finalText = finalTranscriptRef.current;

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const resultText = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalText += ` ${resultText}`;
          } else {
            interim += resultText;
          }
        }

        finalTranscriptRef.current = finalText.trim();

        const liveText = `${finalTranscriptRef.current} ${interim}`.trim();

        if (!liveText) return;

        setTranscript(liveText);
        clearSilenceTimer();

        silenceTimerRef.current = setTimeout(() => {
          handleUserSilence(liveText);
        }, SILENCE_TIMEOUT_MS);
      };

      recognitionRef.current = recognition;
    }

    setError('');
    setTranscript('');
    setBotText('');
    finalTranscriptRef.current = '';
    setState(STATE.LISTENING);

    try {
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (!recognitionActiveRef.current) {
        recognitionRef.current.start();
      }
    } catch (err) {
      console.error('[VoiceRecognition mic]', err);
      setError('Microphone permission denied or unavailable.');
      setState(STATE.ERROR);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearSilenceTimer]);

  const handleUserSilence = useCallback(async (text) => {
    const cleanText = String(text || '').trim();

    if (!cleanText || stateRef.current !== STATE.LISTENING) return;

    stopRecognition();
    setState(STATE.THINKING);

    const response = await AiTextToSpeech(cleanText);

    if (!mountedRef.current) return;

    if (!response?.text) {
      setError('AI response failed. Please try again.');
      setState(STATE.ERROR);
      return;
    }

    setBotText(response.text);
    setState(STATE.SPEAKING);

    if (response.audioUrl) {
      await playAudioWithAnalysis(response.audioUrl);
    } else if ('speechSynthesis' in window) {
      await new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(response.text);
        utterance.lang = import.meta.env.VITE_SPEECH_LANG || 'en-US';
        utterance.onend = resolve;
        utterance.onerror = resolve;
        window.speechSynthesis.speak(utterance);
      });
    }

    if (!mountedRef.current) return;

    onMouthLevel?.(0);
    aiAudioRef.current = null;

    setTimeout(() => {
      if (mountedRef.current) startListening();
    }, 650);
  }, [onMouthLevel, playAudioWithAnalysis, startListening, stopRecognition]);

  const toggleMic = useCallback(() => {
    if (stateRef.current === STATE.SPEAKING || stateRef.current === STATE.THINKING) return;

    if (stateRef.current === STATE.LISTENING) {
      stopRecognition();
      setState(STATE.PAUSED);
      return;
    }

    startListening();
  }, [startListening, stopRecognition]);

  const handleQuitCall = useCallback(() => {
    Swal.fire({
      title: 'End AI session?',
      text: 'Ready to stop practicing for now?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      confirmButtonText: 'Exit',
      cancelButtonText: 'Stay',
      background: '#0f172a',
      color: '#f8fafc',
      customClass: { popup: 'rounded-2xl' },
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      stopRecognition();
      await stopAiAudio();
      await closeAudioContext();
      onMouthLevel?.(0);

      navigate('/', { replace: true });
    });
  }, [closeAudioContext, navigate, onMouthLevel, stopAiAudio, stopRecognition]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearSilenceTimer();
      stopRecognition();
      stopAiAudio();
      closeAudioContext();
      onMouthLevel?.(0);
    };
  }, [clearSilenceTimer, closeAudioContext, onMouthLevel, stopAiAudio, stopRecognition]);

  const currentCaption = state === STATE.SPEAKING ? botText : transcript;

  return (
    <div className="mx-auto flex w-full max-w-[28rem] flex-col items-center gap-3 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:gap-4">
      <SpeechHud
        isSpeaking={state === STATE.LISTENING}
        transcript={transcript}
        state={state}
      />

      <div className="min-h-[54px] w-full">
        {currentCaption && (
          <div className="rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-center shadow-2xl backdrop-blur-xl">
            <p className={`line-clamp-3 text-sm font-semibold leading-6 sm:text-base ${state === STATE.SPEAKING ? 'text-indigo-100' : 'text-white'}`}>
              {state === STATE.SPEAKING ? currentCaption : `"${currentCaption}"`}
            </p>
          </div>
        )}

        {state === STATE.PAUSED && (
          <div className="mx-auto w-fit rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-rose-300">
            Microphone paused
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-center text-xs font-semibold leading-5 text-rose-200">
            {error}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 rounded-[2rem] border border-white/10 bg-white/[0.06] p-3 shadow-2xl backdrop-blur-2xl">
        <button
          type="button"
          onClick={toggleMic}
          disabled={state === STATE.SPEAKING || state === STATE.THINKING}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 sm:h-14 sm:w-14 ${
            state === STATE.LISTENING
              ? 'bg-white text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.35)]'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          } ${(state === STATE.SPEAKING || state === STATE.THINKING) ? 'cursor-not-allowed opacity-40' : 'hover:scale-105 active:scale-95'}`}
          aria-label={state === STATE.LISTENING ? 'Pause microphone' : 'Start microphone'}
        >
          <i className={`fa-solid ${state === STATE.LISTENING ? 'fa-microphone' : 'fa-microphone-slash'} text-lg`} />
        </button>

        <div className="relative">
          <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${getOrbColor()} opacity-50 blur-md ${state !== STATE.PAUSED && state !== STATE.IDLE ? 'animate-pulse' : ''}`} />
          <div className={`relative flex h-16 w-16 flex-col items-center justify-center rounded-full border border-white/20 bg-gradient-to-tr ${getOrbColor()} text-white shadow-inner sm:h-20 sm:w-20`}>
            <span className="text-[9px] font-black uppercase tracking-tight sm:text-[10px]">
              {state}
            </span>

            {state === STATE.LISTENING && (
              <div className="mt-1 flex gap-0.5">
                <span className="h-2 w-0.5 animate-bounce rounded-full bg-white/60" />
                <span className="h-3 w-0.5 animate-bounce rounded-full bg-white [animation-delay:0.2s]" />
                <span className="h-2 w-0.5 animate-bounce rounded-full bg-white/60 [animation-delay:0.4s]" />
              </div>
            )}

            {state === STATE.THINKING && (
              <i className="fa-solid fa-spinner mt-1 animate-spin text-xs" />
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleQuitCall}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-300 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-rose-500 hover:text-white active:scale-95 sm:h-14 sm:w-14"
          aria-label="End AI session"
        >
          <i className="fa-solid fa-phone-slash text-lg" />
        </button>
      </div>
    </div>
  );
}
