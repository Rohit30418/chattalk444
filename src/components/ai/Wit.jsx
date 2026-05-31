import React, { useCallback, useState } from 'react';

const speak = (text) => {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
};

const Wit = ({ play, stop }) => {
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('idle');
  const [lastIntent, setLastIntent] = useState('');

  const handleIntent = useCallback((intents = []) => {
    if (!intents.length) {
      setLastIntent('No intent recognized');
      speak("I didn't understand that.");
      return;
    }

    const intent = intents[0]?.name;
    setLastIntent(intent || 'Unknown intent');

    switch (intent) {
      case 'play_music':
        speak('Playing now.');
        play?.();
        break;

      case 'stop_music':
        speak('Stopping now.');
        stop?.();
        break;

      default:
        speak("I didn't understand that.");
        break;
    }
  }, [play, stop]);

  const getWitResponse = useCallback(async (message) => {
    const token = import.meta.env.VITE_WIT_TOKEN;

    if (!token) {
      setStatus('missing-token');
      speak('Wit token is not configured.');
      return;
    }

    try {
      setStatus('thinking');

      const response = await fetch(
        `https://api.wit.ai/message?v=20200927&q=${encodeURIComponent(message)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Wit.ai error ${response.status}`);
      }

      const data = await response.json();

      handleIntent(data.intents || []);
      setStatus('ready');
    } catch (error) {
      console.error('[Wit]', error);
      setStatus('error');
      speak('There was an error understanding that.');
    }
  }, [handleIntent]);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus('unsupported');
      alert('Your browser does not support speech recognition. Try Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setStatus('listening');

    recognition.onresult = (event) => {
      const speechToText = event.results?.[0]?.[0]?.transcript || '';
      setTranscript(speechToText);

      if (speechToText) getWitResponse(speechToText);
    };

    recognition.onerror = (error) => {
      console.error('[Wit recognition]', error);
      setStatus('error');
    };

    recognition.onend = () => {
      setStatus((prev) => (prev === 'listening' ? 'idle' : prev));
    };

    recognition.start();
  }, [getWitResponse]);

  return (
    <section className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#070b18]/80 p-4 text-white shadow-2xl backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">Voice commands</p>
          <h3 className="text-base font-black">Wit.ai Control</h3>
        </div>

        <span className="rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-400">
          {status}
        </span>
      </div>

      <button
        type="button"
        onClick={startRecognition}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:scale-[1.01] active:scale-[0.98]"
      >
        <i className="fa-solid fa-microphone" />
        Start Recognition
      </button>

      <div className="mt-4 space-y-2 text-xs">
        <div className="rounded-xl bg-white/[0.05] p-3">
          <p className="font-bold text-slate-500">Recognized text</p>
          <p className="mt-1 text-slate-200">{transcript || 'Nothing yet'}</p>
        </div>

        <div className="rounded-xl bg-white/[0.05] p-3">
          <p className="font-bold text-slate-500">Intent</p>
          <p className="mt-1 text-slate-200">{lastIntent || 'Waiting'}</p>
        </div>

        {status === 'missing-token' && (
          <p className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-amber-200">
            Add VITE_WIT_TOKEN in your environment. Do not hardcode tokens in frontend code.
          </p>
        )}
      </div>
    </section>
  );
};

export default Wit;
