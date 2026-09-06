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

const STATE_UI = {
  [STATE.IDLE]: {
    label: 'Ready',
    description: 'Tap the mic to begin',
    dot: 'bg-slate-400',
    chip: 'border-white/10 bg-white/[0.04] text-slate-300',
  },
  [STATE.LISTENING]: {
    label: 'Listening',
    description: 'Speak naturally',
    dot: 'bg-emerald-400',
    chip: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  },
  [STATE.THINKING]: {
    label: 'Thinking',
    description: 'Luna is preparing a reply',
    dot: 'bg-amber-400',
    chip: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  },
  [STATE.SPEAKING]: {
    label: 'Luna speaking',
    description: 'Listen and respond',
    dot: 'bg-violet-400',
    chip: 'border-violet-400/20 bg-violet-400/10 text-violet-200',
  },
  [STATE.PAUSED]: {
    label: 'Paused',
    description: 'Microphone is off',
    dot: 'bg-rose-400',
    chip: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
  },
  [STATE.ERROR]: {
    label: 'Needs attention',
    description: 'Check your microphone',
    dot: 'bg-red-400',
    chip: 'border-red-400/20 bg-red-400/10 text-red-200',
  },
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
      cancelButtonColor: '#0f766e',
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
  const currentUi = STATE_UI[state] || STATE_UI[STATE.IDLE];
  const controlsDisabled = state === STATE.SPEAKING || state === STATE.THINKING;

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      <aside className="pointer-events-auto absolute right-5 top-24 hidden w-[320px] lg:block xl:right-8 xl:w-[340px]">
        <SpeechHud
          isSpeaking={state === STATE.LISTENING}
          transcript={transcript}
          state={state}
        />
      </aside>

      <div className="absolute inset-y-0 left-0 right-0 lg:right-[22rem]">
        <div className="absolute bottom-[112px] left-1/2 w-[min(92%,42rem)] -translate-x-1/2 sm:bottom-[118px]">
          {currentCaption ? (
            <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#0b1220]/95 px-4 py-3 shadow-lg sm:px-5 sm:py-4">
              <div className="mb-1.5 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.16em]">
                <span className={state === STATE.SPEAKING ? 'text-violet-300' : 'text-teal-300'}>
                  {state === STATE.SPEAKING ? 'Luna' : 'You'}
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-600" />
                <span className="text-slate-500">
                  {state === STATE.SPEAKING ? 'AI reply' : 'Live transcript'}
                </span>
              </div>
              <p className={`line-clamp-3 text-center text-sm font-semibold leading-6 sm:text-base ${
                state === STATE.SPEAKING ? 'text-violet-100' : 'text-white'
              }`}>
                {currentCaption}
              </p>
            </div>
          ) : (
            <div className="mx-auto hidden w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-[#0b1220]/80 px-4 py-2 text-[10px] font-bold text-slate-400 sm:flex">
              <i className="fa-solid fa-microphone-lines text-teal-400" aria-hidden="true" />
              Tap the microphone and start speaking naturally.
            </div>
          )}

          {error && (
            <div className="mx-auto mt-2 max-w-lg rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-2.5 text-center text-xs font-semibold text-rose-200">
              {error}
            </div>
          )}
        </div>

        <div className="pointer-events-auto absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-[1.35rem] border border-white/10 bg-[#0b1220]/95 p-2 shadow-lg sm:gap-3 sm:p-2.5">
            <button
              type="button"
              onClick={toggleMic}
              disabled={controlsDisabled}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors sm:h-14 sm:w-14 ${
                state === STATE.LISTENING
                  ? 'border-emerald-300/20 bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                  : 'border-white/10 bg-white/[0.055] text-slate-200 hover:bg-white/[0.09]'
              } ${controlsDisabled ? 'cursor-not-allowed opacity-40' : ''}`}
              aria-label={state === STATE.LISTENING ? 'Pause microphone' : 'Start microphone'}
            >
              <i
                className={`fa-solid ${
                  state === STATE.LISTENING ? 'fa-microphone' : 'fa-microphone-slash'
                } text-base`}
                aria-hidden="true"
              />
            </button>

            <div className={`flex h-12 min-w-[128px] items-center gap-3 rounded-xl border px-3 sm:h-14 sm:min-w-[156px] sm:px-4 ${currentUi.chip}`}>
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${currentUi.dot}`} />
              <div className="min-w-0 leading-tight">
                <div className="truncate text-[10px] font-black uppercase tracking-[0.12em] sm:text-[11px]">
                  {currentUi.label}
                </div>
                <div className="mt-1 hidden truncate text-[9px] font-semibold normal-case tracking-normal opacity-70 sm:block">
                  {currentUi.description}
                </div>
              </div>
              {state === STATE.THINKING && (
                <i className="fa-solid fa-spinner ml-auto animate-spin text-[10px]" aria-hidden="true" />
              )}
              {state === STATE.SPEAKING && (
                <i className="fa-solid fa-wave-square ml-auto text-[10px]" aria-hidden="true" />
              )}
            </div>

            <button
              type="button"
              onClick={handleQuitCall}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-rose-400/15 bg-rose-400/10 text-rose-300 transition-colors hover:bg-rose-500 hover:text-white sm:h-14 sm:w-14"
              aria-label="End AI session"
            >
              <i className="fa-solid fa-phone-slash text-base" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
