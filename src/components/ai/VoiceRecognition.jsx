import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AiTextToSpeech from "./AiTextToSpeech";
import Swal from "sweetalert2";
import SpeechHud from "./SpeechHud"; 

const STATE = {
  IDLE: "idle",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking",
  PAUSED: "paused",
};

export default function VoiceRecognition({ onMouthLevel }) {
  const [state, setState] = useState(STATE.IDLE);
  const [transcript, setTranscript] = useState("");
  const [botText, setBotText] = useState("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const recognitionRef = useRef(null);
  const silenceTimer = useRef(null);
  const stateRef = useRef(STATE.IDLE);
  const micStreamRef = useRef(null);
  const aiAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const stopBrowserMic = () => {
    try {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    } catch {}
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      if (stateRef.current !== STATE.LISTENING) return;
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      const text = final + interim;
      if (!text.trim()) return;
      setTranscript(text);
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => handleUserSilence(text), 1100);
    };

    return () => {
      try { recognition.stop(); } catch {}
      stopBrowserMic();
      if (audioContextRef.current) audioContextRef.current.close();
      if (aiAudioRef.current) {
        aiAudioRef.current.pause();
        aiAudioRef.current = null;
      }
    };
  }, []);

  const handleUserSilence = async (text) => {
    if (!text.trim()) return;
    try { recognitionRef.current?.stop(); } catch {}
    setState(STATE.THINKING);
    const response = await AiTextToSpeech(text);
    if (!response) {
      startListening();
      return;
    }
    setBotText(response.text);
    setIsAiSpeaking(true);
    stopBrowserMic();
    setState(STATE.SPEAKING);
    await playAudioWithAnalysis(response.audioUrl);
    aiAudioRef.current = null;
    setIsAiSpeaking(false);
    onMouthLevel(0);
    setTimeout(() => startListening(), 700);
  };

  const playAudioWithAnalysis = async (url) => {
    return new Promise(async (resolve) => {
      const audio = new Audio(url);
      audio.crossOrigin = "anonymous"; 
      aiAudioRef.current = audio;
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") await ctx.resume();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(ctx.destination); 
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMouth = () => {
        if (!audio.paused && !audio.ended) {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const level = Math.min(1.0, avg / 50);
          onMouthLevel(level);
          requestAnimationFrame(updateMouth);
        }
      };
      audio.onended = () => {
        onMouthLevel(0);
        resolve(); 
      };
      try {
        await audio.play();
        updateMouth();
      } catch (err) {
        resolve();
      }
    });
  };

  const startListening = async () => {
    setTranscript("");
    setBotText("");
    setState(STATE.LISTENING);
    try {
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      recognitionRef.current?.start();
    } catch (err) {
      console.log("Mic access error:", err);
    }
  };

  const toggleMic = () => {
    if (isAiSpeaking) return;
    if (stateRef.current === STATE.LISTENING) {
      try { recognitionRef.current?.stop(); } catch {}
      stopBrowserMic();
      setState(STATE.PAUSED);
    } else {
      startListening();
    }
  };

  const handleQuitCall = () => {
    Swal.fire({
      title: "End Session?",
      text: "Ready to stop practicing for now?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6366f1",
      confirmButtonText: "Yes, Exit",
      background: "#0f172a",
      color: "#f8fafc"
    }).then((result) => {
      if (result.isConfirmed) {
        try { recognitionRef.current?.stop(); } catch {}
        stopBrowserMic();
        onMouthLevel?.(0);
        navigate("/", { replace: true });
      }
    });
  };

  const getOrbColor = () => {
    switch (state) {
      case STATE.LISTENING: return "from-emerald-400 to-cyan-400";
      case STATE.THINKING: return "from-amber-400 to-orange-500";
      case STATE.SPEAKING: return "from-indigo-500 to-purple-600";
      case STATE.PAUSED: return "from-rose-500 to-red-600";
      default: return "from-slate-400 to-slate-600";
    }
  };

  return (
    <>
      {/* 🚀 ANALYTICS HUD OVERLAY */}
   

      {/* 📱 BOTTOM UI INTERFACE */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 w-full max-w-lg z-50 px-6">
           <SpeechHud isSpeaking={state === STATE.LISTENING} transcript={transcript} />
        {/* TRANSCRIPT CAPTIONS */}
        <div className="text-center min-h-[60px] w-full flex flex-col items-center justify-end">
          {(transcript || botText) && (
            <div className="bg-black/40 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl shadow-2xl animate-fade-in-up">
              <p className={`text-lg font-medium tracking-tight ${state === STATE.SPEAKING ? 'text-indigo-200' : 'text-white'}`}>
                {state === STATE.SPEAKING ? botText : `"${transcript}"`}
              </p>
            </div>
          )}
          {state === STATE.PAUSED && (
            <span className="text-rose-400 text-xs font-black uppercase tracking-widest bg-rose-500/10 px-4 py-1.5 rounded-full border border-rose-500/20">
              Microphone Muted
            </span>
          )}
        </div>

        {/* FUTURISTIC CONTROL BAR */}
        <div className="flex items-center gap-6 bg-white/5 backdrop-blur-2xl p-4 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] group hover:border-white/20 transition-all">
          
          {/* MIC TOGGLE */}
          <button
            onClick={toggleMic}
            disabled={isAiSpeaking}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
              state === STATE.LISTENING
                ? "bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            } ${isAiSpeaking ? "opacity-30 cursor-not-allowed" : "hover:scale-110 active:scale-95"}`}
          >
            <i className={`text-xl fa-solid ${state === STATE.LISTENING ? "fa-microphone" : "fa-microphone-slash"}`}></i>
          </button>

          {/* STATUS ORB */}
          <div className="relative">
            <div className={`absolute inset-0 rounded-full blur-md opacity-50 bg-gradient-to-tr ${getOrbColor()} transition-all duration-500 ${state !== STATE.PAUSED && 'animate-pulse'}`}></div>
            <div className={`relative w-20 h-20 rounded-full border-2 border-white/20 flex flex-col items-center justify-center text-white transition-all duration-500 bg-gradient-to-tr ${getOrbColor()} shadow-inner`}>
                <span className="text-[10px] font-black uppercase tracking-tighter leading-none mb-1">
                  {state}
                </span>
                {state === STATE.LISTENING && (
                  <div className="flex gap-0.5 mt-1">
                    <div className="w-0.5 h-2 bg-white/60 rounded-full animate-bounce"></div>
                    <div className="w-0.5 h-3 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-0.5 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                )}
            </div>
          </div>

          {/* EXIT BUTTON */}
          <button
            onClick={handleQuitCall}
            className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center shadow-lg"
          >
            <i className="text-xl fa-solid fa-phone-slash"></i>
          </button>
        </div>
      </div>
    </>
  );
}