import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import useAddMembers from "../../hooks/useAddMembers";
import { useParams } from "react-router";
import { tooglePrescreenRoom, setMediaPrefs } from "../../redux/action";

const ScreenBeforeJoin = ({ userData }) => {
  const { id } = useParams();
  const addMember = useAddMembers();
  const dispatch = useDispatch();

  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // --- 1. MEDIA LOGIC (Kept same as your code) ---
  useEffect(() => {
    const startStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Default: Start OFF
        stream.getVideoTracks().forEach(t => t.enabled = false);
        stream.getAudioTracks().forEach(t => t.enabled = false);

        // Audio Analysis
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        
        source.connect(analyser);
        analyser.fftSize = 64; // Smaller FFT for smoother visualizer bars
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        const checkAudioLevel = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(average); 
            animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
        };
        
        checkAudioLevel();

      } catch (err) {
        console.error("Error accessing media:", err);
      }
    };

    startStream();

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const toggleCam = () => {
    if (streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !isCamOn;
            setIsCamOn(!isCamOn);
        }
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
        const audioTrack = streamRef.current.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !isMicOn;
            setIsMicOn(!isMicOn);
        }
    }
  };

  const handleJoin = () => {
    dispatch(setMediaPrefs({ audio: isMicOn, video: isCamOn }));
    addMember(id);
    dispatch(tooglePrescreenRoom(false));
  };

  return (
    // 🔥 BACKGROUND: Deep Navy with Floating Blobs
    <div className="relative w-full min-h-screen flex flex-col justify-center items-center bg-[#02040a] text-white overflow-hidden p-6 font-sans">
      
      {/* Animated Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>

      {/* --- MAIN GLASS CARD --- */}
      <div className="relative w-full max-w-4xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl flex flex-col md:flex-row gap-12 items-center z-10">
        
        {/* LEFT: PREVIEW AREA */}
        <div className="w-full md:w-1/2 flex flex-col gap-6">
            <div className="relative w-full aspect-[4/3] bg-black/50 rounded-3xl overflow-hidden border border-white/10 shadow-inner group">
                
                {/* Video Stream */}
                <video 
                  ref={videoRef} 
                  autoPlay muted playsInline 
                  className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${isCamOn ? 'opacity-100' : 'opacity-0'}`}
                />

                {/* Avatar Fallback (When Cam Off) */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500 ${isCamOn ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl animate-pulse"></div>
                        <img 
                            src={userData?.photoURL || "https://api.dicebear.com/7.x/bottts/svg?seed=User"} 
                            alt="User" 
                            className="relative w-28 h-28 rounded-full border-4 border-[#02040a] shadow-2xl object-cover bg-slate-800"
                        />
                    </div>
                    <p className="mt-4 text-slate-400 text-sm font-medium tracking-wide">Camera is turned off</p>
                </div>

                {/* Status Badges (Top Corners) */}
                <div className="absolute top-4 left-4 flex gap-2">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${isMicOn ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                        {isMicOn ? 'Mic On' : 'Mic Off'}
                    </div>
                </div>

                {/* Audio Visualizer (Bottom Center) */}
                {isMicOn && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 items-end h-8">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div 
                                key={i} 
                                className="w-1.5 bg-green-400 rounded-full transition-all duration-75 shadow-[0_0_10px_rgba(74,222,128,0.5)]" 
                                style={{ height: `${Math.max(20, Math.min(100, audioLevel * (Math.random() * 2)))}%` }}
                            ></div>
                        ))}
                    </div>
                )}
            </div>

            {/* Toggle Controls */}
            <div className="flex justify-center gap-6">
                <button 
                    onClick={toggleMic}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all duration-300 border ${
                        isMicOn 
                        ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105' 
                        : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white'
                    }`}
                >
                    <i className={`fa-solid ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
                </button>

                <button 
                    onClick={toggleCam}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all duration-300 border ${
                        isCamOn 
                        ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105' 
                        : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white'
                    }`}
                >
                    <i className={`fa-solid ${isCamOn ? 'fa-video' : 'fa-video-slash'}`}></i>
                </button>
            </div>
        </div>

        {/* RIGHT: INFO & JOIN */}
        <div className="w-full md:w-1/2 flex flex-col justify-between h-full space-y-8">
            <div>
                <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
                    Ready to Connect
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                    Join the <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Conversation</span>
                </h1>
                <p className="text-slate-400 text-lg">
                    You are about to enter <span className="text-white font-bold">Room #{id.slice(0,6)}</span>.
                    Check your hair, test your mic, and let's go!
                </p>
            </div>

            <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-slate-300">Device Status</span>
                    <span className="text-xs text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Good to go
                    </span>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                        <i className={`fa-solid fa-microphone ${isMicOn ? 'text-green-400' : 'text-red-400'}`}></i>
                        <span>Microphone: <strong className="text-white">{isMicOn ? 'Active' : 'Muted'}</strong></span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                        <i className={`fa-solid fa-video ${isCamOn ? 'text-green-400' : 'text-red-400'}`}></i>
                        <span>Camera: <strong className="text-white">{isCamOn ? 'Active' : 'Disabled'}</strong></span>
                    </div>
                </div>
            </div>

            <button
                onClick={handleJoin}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black text-xl shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
            >
                Join Room Now
                <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </button>
        </div>

      </div>
    </div>
  );
};

export default ScreenBeforeJoin;