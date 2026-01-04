import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useGetCollectionData from "../../hooks/useGetCollectionData";
import { useSelector } from "react-redux";
import useAddMembers from "../../hooks/useAddMembers";
import { toast } from "react-toastify";

// --- Custom Tailwind Animations for the Audio Bars ---
const RoomCard = ({ roomdata }) => {
  const navigate = useNavigate();
  const [isOpenRoomDetails, setIsOpenRoomDetails] = useState(false);

  const uId = useSelector((state) => state.userData.uid);
  const loginStatus = useSelector((state) => state.loginStatus);

  const { collectionData = [] } =
    useGetCollectionData("participants", roomdata.id, "", "rooms") || {};

  const colors = [
    "#a020f0", "#f7536c", "#3674B5", "#99BC85", "#FFD6BA",
    "#F94144", "#F3722C", "#F9C74F", "#90BE6D", "#43AA8B",
    "#577590", "#277DA1", "#FF6F91", "#FF9671", "#FFC75F",
  ];

  const getStableColor = (str, colorArray) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colorArray[Math.abs(hash) % colorArray.length];
  };

  const randomColor = useMemo(
    () => getStableColor(roomdata.id, colors),
    [roomdata.id]
  );

  const displayParticipants = useMemo(() => {
    if (collectionData.length > 0) return collectionData;
    const isDummy = typeof roomdata.id === 'string' && roomdata.id.startsWith("room_");
    if (isDummy) {
      const count = Number(roomdata.participantsCount) || 0;
      return Array.from({ length: count }).map((_, i) => ({
        data: {
          photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${roomdata.id}_${i}`,
          name: "Guest User"
        }
      }));
    }
    return [];
  }, [collectionData, roomdata]);

  const speakingIndices = useMemo(() => {
    const total = displayParticipants.length;
    const indices = new Set();
    if (total === 0) return indices;
    const numberOfSpeakers = Math.random() > 0.5 ? 1 : 2;
    while (indices.size < numberOfSpeakers && indices.size < total) {
      indices.add(Math.floor(Math.random() * total));
    }
    return indices;
  }, [displayParticipants]);

  const emptySlots = useMemo(() => {
    const max = Number(roomdata.MaximumPeople) || 0;
    return Math.max(0, max - displayParticipants.length);
  }, [displayParticipants.length, roomdata.MaximumPeople]);

  const joinRoom = async (roomId) => {
    navigate(`/Room/${roomId}`)
  };

  const handleJoin = () => {
    if (!loginStatus) {
      toast.error("Please sign in to join any room");
      return;
    }
    if (emptySlots === 0) {
      toast.error("Room is full");
      return;
    }
    joinRoom(roomdata.id);
  };

  const audioStyles = `
    @keyframes bounce-1 { 0%, 100% { height: 4px; } 50% { height: 12px; } }
    @keyframes bounce-2 { 0%, 100% { height: 8px; } 50% { height: 16px; } }
    @keyframes bounce-3 { 0%, 100% { height: 6px; } 50% { height: 10px; } }
    .animate-bar-1 { animation: bounce-1 0.8s infinite ease-in-out; }
    .animate-bar-2 { animation: bounce-2 0.9s infinite ease-in-out 0.1s; }
    .animate-bar-3 { animation: bounce-3 0.7s infinite ease-in-out 0.2s; }
  `;

  return (
    <>
      <style>{audioStyles}</style>
      <div className="w-full h-full">
        <div
          className="group relative w-full h-[300px] flex flex-col justify-between rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800"
        >
          {/* 1. Ambient Background Glow (Subtle) */}
          <div 
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-10 dark:opacity-20 transition-opacity duration-500 group-hover:opacity-20 dark:group-hover:opacity-30"
            style={{ backgroundColor: randomColor }}
          />

          {/* Owner Border Indicator */}
          {uId === roomdata.ownerUid && (
            <div className="absolute inset-0 border-2 border-yellow-400/50 rounded-3xl z-20 pointer-events-none"></div>
          )}

          {/* Settings Icon */}
          <div className="absolute top-4 right-4 z-30">
            <button
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
              onMouseEnter={() => setIsOpenRoomDetails(true)}
              onMouseLeave={() => setIsOpenRoomDetails(false)}
            >
              <i className="fa fa-cog text-lg"></i>
            </button>
          </div>

          {/* --- CARD CONTENT --- */}
          <div className="relative z-10 h-full flex flex-col justify-between p-6">
            
            {/* Top: Tags & Title */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                {/* Language Tag */}
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-gray-300">
                   <img src={`https://flagsapi.com/${roomdata?.flagCode}/flat/64.png`} className="w-4 h-4" alt="flag" />
                   {roomdata?.Language}
                </span>
                
                {/* Level Tag (Colored) */}
                <span 
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: randomColor }}
                >
                  {roomdata?.Level}
                </span>
              </div>

              <h3
                className="text-sm font-bold text-gray-800 dark:text-white leading-tight line-clamp-2 mb-1"
                title={roomdata?.Title}
              >
                {roomdata?.Title}
              </h3>
            </div>

            {/* Middle: Participants Stack */}
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center -space-x-3 pl-1">
                {displayParticipants.slice(0, 5).map((user, index) => {
                  const isSpeaking = speakingIndices.has(index);
                  
                  return (
                    <div key={index} className="relative group/avatar">
                      {/* Avatar Container: Border matches card bg */}
                      <div className={`relative w-12 h-12 rounded-full p-[2px] ${isSpeaking ? 'bg-green-500' : 'bg-transparent'}`}>
                        <img
                          src={user?.data?.photo}
                          alt={user?.data?.name}
                          className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900 bg-gray-200 dark:bg-slate-800"
                        />
                      </div>
                      
                      {/* Audio Visualizer Overlay */}
                      {isSpeaking && (
                         <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center gap-[2px] z-10 pointer-events-none border-2 border-white dark:border-slate-900">
                            <div className="w-[3px] bg-green-400 rounded-full animate-bar-1"></div>
                            <div className="w-[3px] bg-green-400 rounded-full animate-bar-2"></div>
                            <div className="w-[3px] bg-green-400 rounded-full animate-bar-3"></div>
                         </div>
                      )}
                    </div>
                  );
                })}

                {/* Overflow Counter */}
                {displayParticipants.length > 5 && (
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                    +{displayParticipants.length - 5}
                  </div>
                )}
              </div>

               {/* Spots Left Text */}
               {emptySlots > 0 ? (
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1 mt-1">
                     <span className="text-green-600 dark:text-green-400 font-bold">{emptySlots}</span> spots remaining
                  </div>
                ) : (
                  <div className="text-xs font-medium text-red-500 ml-1 mt-1">
                    Room Full
                  </div>
                )}
            </div>

            {/* Bottom: Join Button */}
            <div className="pt-4">
              <button
                onClick={handleJoin}
                disabled={emptySlots === 0}
                className={`
                  w-full relative overflow-hidden group/btn font-bold py-3 px-4 rounded-xl shadow-md transition-all duration-300 
                  ${emptySlots === 0 
                    ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r bg-primary hover:to-blue-500 text-white hover:shadow-indigo-500/30'
                  }
                `}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {emptySlots === 0 ? "Room Full" : "Join Discussion"}
                  {emptySlots > 0 && (
                    <i className="fa-solid fa-arrow-right text-sm transition-transform group-hover/btn:translate-x-1"></i>
                  )}
                </span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default RoomCard;