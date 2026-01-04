import React, { useState } from "react";
import { useDispatch } from "react-redux";
import useAddMembers from "../../hooks/useAddMembers";
import { useParams } from "react-router";
import { tooglePrescreenRoom } from "../../redux/action";

const ScreenBeforeJoin = ({ userData }) => {
  const { id } = useParams();
  const addMember = useAddMembers();
  const dispatch = useDispatch();

  // Local state for visual toggles (Mic/Cam)
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);

  const handleJoin = () => {
    addMember(id);
    dispatch(tooglePrescreenRoom(false));
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-slate-950 px-4 transition-colors duration-300">
      
      {/* Decorative Background Blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none mix-blend-multiply dark:mix-blend-screen opacity-50 animate-blob"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none mix-blend-multiply dark:mix-blend-screen opacity-50 animate-blob animation-delay-2000"></div>

      {/* Main Card */}
      <div className="relative bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xl w-full max-w-md flex flex-col items-center z-10">
        
        {/* Header Text */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Ready to join?
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            You are about to enter Room <br />
            <span className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded text-xs tracking-wider">
              {id}
            </span>
          </p>
        </div>

        {/* Avatar / Camera Preview Area */}
        <div className="relative mb-8 group">
           {/* Ring Animation */}
           <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
           
           <div className="relative w-32 h-32 rounded-full p-1 bg-white dark:bg-slate-900">
             <img
              src={userData?.photoURL || "https://via.placeholder.com/150"}
              alt={userData?.displayName}
              className={`w-full h-full rounded-full object-cover border-4 ${isCamOn ? 'border-transparent' : 'border-gray-200 dark:border-slate-800'} transition-all`}
            />
            
            {/* Cam Off Overlay (Visual) */}
            {!isCamOn && (
               <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-[1px]">
                  <i className="fa-solid fa-video-slash text-white/50 text-2xl"></i>
               </div>
            )}
           </div>

           {/* Online Status */}
           <span className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full shadow-sm"></span>
        </div>

        {/* User Name */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {userData?.displayName}
        </h2>

        {/* Media Toggles (Visual Only) */}
        <div className="flex gap-4 mb-8">
           <button 
             onClick={() => setIsMicOn(!isMicOn)}
             className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMicOn ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-white border border-gray-200 dark:border-slate-700' : 'bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-900/50'}`}
           >
             <i className={`fa-solid ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
           </button>
           <button 
             onClick={() => setIsCamOn(!isCamOn)}
             className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCamOn ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-white border border-gray-200 dark:border-slate-700' : 'bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-900/50'}`}
           >
             <i className={`fa-solid ${isCamOn ? 'fa-video' : 'fa-video-slash'}`}></i>
           </button>
        </div>

        {/* Join Button */}
        <button
          onClick={handleJoin}
          className="group w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2"
        >
          <span>Join Now</span>
          <i className="fa-solid fa-arrow-right text-sm transition-transform group-hover:translate-x-1"></i>
        </button>

      </div>

      {/* Footer Helper */}
      <div className="mt-8 flex items-center gap-2 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
        <i className="fa-solid fa-shield-halved"></i>
        <span>End-to-End Encrypted</span>
      </div>
    </div>
  );
};

export default ScreenBeforeJoin;