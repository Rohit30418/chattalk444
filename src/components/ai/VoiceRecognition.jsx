import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AiTextToSpeech from "../ai/AiTextToSpeech";
// We don't need the external analyzeAudio file anymore, we do it inline for better control
import Swal from "sweetalert2";

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

  // Audio Context for Lip Sync
  const audioContextRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ======================
  // STOP MICROPHONE STREAM
  // ======================
  const stopBrowserMic = () => {
    try {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    } catch {}
  };

  // ======================
  // INIT SPEECH RECOGNITION
  // ======================
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

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

      // silence detection
      silenceTimer.current = setTimeout(() => {
        handleUserSilence(text);
      }, 1100);
    };

    recognition.onerror = () => {};

    // CLEANUP on unmount
    return () => {
      try { recognition.stop(); } catch {}
      stopBrowserMic();
      
      // Cleanup Audio Context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      if (aiAudioRef.current) {
        aiAudioRef.current.pause();
        aiAudioRef.current = null;
      }
    };
  }, []);

  // ======================
  // HANDLE USER SILENCE → AI RESPONSE
  // ======================
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

    // Mic OFF while AI speaks
    setIsAiSpeaking(true);
    stopBrowserMic();
    setState(STATE.SPEAKING);

    // --- FIX: Audio Analysis Logic ---
    await playAudioWithAnalysis(response.audioUrl);

    aiAudioRef.current = null;
    setIsAiSpeaking(false);
    onMouthLevel(0); // Reset mouth when done

    // After short delay, restart human listening
    setTimeout(() => startListening(), 700);
  };

  // ======================
  // NEW: Play Audio + Analyze for Mouth
  // ======================
  const playAudioWithAnalysis = async (url) => {
    return new Promise(async (resolve) => {
      const audio = new Audio(url);
      audio.crossOrigin = "anonymous"; // Important for some browsers
      aiAudioRef.current = audio;

      // Create AudioContext if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      // Resume context (browsers sometimes suspend it)
      if (ctx.state === "suspended") await ctx.resume();

      // Create Source and Analyzer
      // Note: createMediaElementSource can crash if reused on same element, 
      // but 'audio' is a new instance here, so it is safe.
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;

      source.connect(analyser);
      analyser.connect(ctx.destination); // Connect to speakers

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      // Animation Loop
      const updateMouth = () => {
        if (!audio.paused && !audio.ended) {
          analyser.getByteFrequencyData(dataArray);
          
          // Calculate volume average
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          
          // Normalize (0-255 -> 0.0-1.0)
          // Divide by 50 to make it more sensitive for the 3D model
          const level = Math.min(1.0, avg / 50);
          
          onMouthLevel(level);
          requestAnimationFrame(updateMouth);
        }
      };

      audio.onended = () => {
        onMouthLevel(0);
        resolve(); // Audio finished
      };

      try {
        await audio.play();
        updateMouth();
      } catch (err) {
        console.error("Audio playback failed", err);
        resolve(); // Resolve anyway to not block the app
      }
    });
  };

  // ======================
  // START LISTENING
  // ======================
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

  // ======================
  // TOGGLE MIC
  // ======================
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

  // ======================
  // QUIT CALL
  // ======================
  const handleQuitCall = () => {
    Swal.fire({
      title: "End Call?",
      text: "Are you sure you want to quit the AI voice call?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, End Call",
    }).then((result) => {
      if (result.isConfirmed) {
        try { recognitionRef.current?.stop(); } catch {}
        window.speechSynthesis?.cancel();
        stopBrowserMic();

        if (aiAudioRef.current) {
          aiAudioRef.current.pause();
          aiAudioRef.current = null;
        }
        
        if (audioContextRef.current) {
           audioContextRef.current.close();
        }

        onMouthLevel?.(0);
        navigate("/", { replace: true });
      }
    });
  };

  const getOrbStyle = () => {
    switch (state) {
      case STATE.LISTENING:
        return "bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.6)] animate-pulse";
      case STATE.THINKING:
        return "bg-yellow-400 animate-bounce";
      case STATE.SPEAKING:
        return "bg-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.8)] scale-110";
      case STATE.PAUSED:
        return "bg-red-500/50 border-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 w-full max-w-md z-50">

      <div className="text-center min-h-[50px] px-4 w-full flex flex-col items-center justify-end mb-2">
        {state === STATE.LISTENING && transcript && (
          <p className="text-white text-lg font-medium bg-black/60 px-4 py-2 rounded-xl">
            "{transcript}"
          </p>
        )}

        {state === STATE.SPEAKING && botText && (
          <p className="text-blue-200 text-lg font-medium bg-black/60 px-4 py-2 rounded-xl">
            {botText}
          </p>
        )}

        {state === STATE.PAUSED && (
          <span className="text-red-300 text-xs font-bold uppercase bg-red-900/80 px-3 py-1 rounded-full">
            Mic Muted
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 bg-gray-900/80 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
        <button
          onClick={toggleMic}
          disabled={isAiSpeaking}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            state === STATE.LISTENING
              ? "bg-white text-black"
              : "bg-gray-700 text-gray-400"
          } ${isAiSpeaking ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {state === STATE.LISTENING ? (
            <i className="fas fa-microphone"></i>
          ) : (
            <i className="fas fa-microphone-slash"></i>
          )}
        </button>

        <div
          className={`w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center text-white text-[10px] uppercase ${getOrbStyle()}`}
        >
          {state === STATE.THINKING
            ? "Thinking"
            : state === STATE.SPEAKING
            ? "Speaking"
            : state === STATE.PAUSED
            ? "Muted"
            : "Listening"}
        </div>

        <button
          onClick={handleQuitCall}
          className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white"
        >
          <i className="fas fa-phone-slash"></i>
        </button>
      </div>
    </div>
  );
}