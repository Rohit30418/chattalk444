import React from "react";
import { Link } from "react-router-dom"; // Assuming react-router is used

const rooms = [
  {
    id: 1,
    title: "🦥 Procrastinators Assemble #6",
    language: "Portuguese",
    flag: "https://flagsapi.com/PT/flat/64.png",
    level: "#intermediate",
    color: "rgb(153, 188, 133)",
    participants: ["Fatima1", "Sara2", "Jake3", "Fatima4", "Extra1"],
    full: true,
  },
  {
    id: 2,
    title: "🫠 Socially Awkward Club #5",
    language: "Urdu",
    flag: "https://flagsapi.com/PK/flat/64.png",
    level: "#advanced",
    color: "rgb(255, 180, 160)",
    participants: ["Ahmed1", "Zuri2", "Camille3"],
    full: true,
  },
  {
    id: 3,
    title: "🎤 Mic Check for No Reason #6",
    language: "Hindi",
    flag: "https://flagsapi.com/IN/flat/64.png",
    level: "#upper-intermediate",
    color: "rgb(67, 170, 139)",
    participants: ["Jean1", "Jake2", "Rohit3", "Valentina4"],
    full: true,
  },
  {
    id: 4,
    title: "🎮 Gamers Who Rage Quit #5",
    language: "German",
    flag: "https://flagsapi.com/DE/flat/64.png",
    level: "#upper-intermediate",
    color: "rgb(255, 199, 95)",
    participants: ["Sara1", "Sara2"],
    full: true,
  },
  {
    id: 5,
    title: "🎵 Singing Like No One’s Judging #4",
    language: "English",
    flag: "https://flagsapi.com/GB/flat/64.png",
    level: "#beginner",
    color: "rgb(255, 111, 145)",
    participants: ["Neha1", "Layla2", "Omar3", "Hiro4", "Camille5", "Rohit6"],
    full: true, // Marked as full for demonstration
  },
  {
    id: 6,
    title: "🚪 People Who Just Left Zoom Calls #4",
    language: "Mandarin",
    flag: "https://flagsapi.com/CN/flat/64.png",
    level: "#beginner",
    color: "rgb(100, 200, 255)",
    participants: ["Mateo1", "Hiro2", "Jean3", "Mateo4", "Omar5"],
    full: true,
  },
];

export default function ActiveRoomsSection() {
  return (
    <section className="py-20 bg-gray-50 px-4 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* --- Heading --- */}
        <div className="text-center mb-16">
          <span className="inline-block py-1 px-3 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-wide mb-3 border border-indigo-100 dark:border-indigo-800">
            Live Now
          </span>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
            Active <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Voice Rooms</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Jump into live conversations happening right now. No scheduling required.
          </p>
        </div>

        {/* --- Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rooms.map((room) => (
            <div key={room.id} className="h-full">
              <div
                className="group relative w-full h-[320px] flex flex-col justify-between rounded-3xl p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* 1. Ambient Glow (Derived from room color) */}
                <div 
                  className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-10 dark:opacity-20 transition-opacity duration-500 group-hover:opacity-25"
                  style={{ backgroundColor: room.color }}
                />

                {/* Settings Icon */}
                <button className="absolute top-5 right-5 z-20 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  <i className="fa fa-cog text-lg"></i>
                </button>

                {/* --- CARD TOP: Tags & Title --- */}
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    {/* Language Tag */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-gray-300">
                      <img
                        src={room.flag}
                        alt={room.language}
                        className="w-4 h-4 object-contain"
                      />
                      {room.language}
                    </div>
                    {/* Level Tag */}
                    <div 
                      className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: room.color }}
                    >
                      {room.level}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
                    {room.title}
                  </h3>
                </div>

                {/* --- CARD BOTTOM: Participants & Button --- */}
                <div className="relative z-10 mt-auto pt-6">
                  
                  {/* Avatar Stack */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center -space-x-3 pl-1">
                      {room.participants.slice(0, 5).map((seed, i) => (
                        <div key={i} className="relative transition-transform duration-300 hover:z-10 hover:scale-110">
                          <img
                            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${seed}`}
                            alt="User"
                            className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 bg-gray-100 dark:bg-slate-800"
                          />
                        </div>
                      ))}
                      {/* Overflow Counter */}
                      {room.participants.length > 5 && (
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 z-0">
                          +{room.participants.length - 5}
                        </div>
                      )}
                    </div>

                    {/* Live Indicator or "Full" Text */}
                    {!room.full ? (
                       <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          Live
                       </div>
                    ) : (
                      <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
                        Full
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  <button 
                    disabled={room.full}
                    className={`w-full relative overflow-hidden group/btn font-bold py-3 px-4 rounded-xl shadow-md transition-all duration-300 flex items-center justify-center gap-2
                    ${room.full 
                      ? "bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed" 
                      : "bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-200 text-white dark:text-gray-900 hover:shadow-lg hover:-translate-y-0.5"
                    }`}
                  >
                    {room.full ? "Room at Capacity" : "Join Conversation"}
                    {!room.full && <i className="fa-solid fa-arrow-right text-sm transition-transform group-hover/btn:translate-x-1"></i>}
                  </button>

                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-12">
          <Link to="/rooms" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            View all active rooms <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
        
      </div>
    </section>
  );
}