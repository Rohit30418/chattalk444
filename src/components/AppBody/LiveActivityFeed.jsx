import React, { useState, useEffect, useRef } from 'react';

// --- DATA GENERATORS ---
const NAMES = ["Sarah", "Raj", "Mike", "Anya", "Jin", "Fatima", "Carlos", "Priya", "John", "Emma"];
const ACTIONS = [
  { text: "joined", color: "bg-emerald-500", icon: "door-open" },
  { text: "is speaking in", color: "bg-indigo-500", icon: "microphone" },
  { text: "reached Lvl 5", color: "bg-amber-500", icon: "fire" },
  { text: "created room", color: "bg-rose-500", icon: "plus" },
];
const ROOMS = ["English Cafe", "Anime Talk", "Biz English", "Chill Zone", "Rap God", "Tech Talk"];

const LiveActivityFeed = () => {
  // Initial State with some dummy data
  const [activities, setActivities] = useState([
    { id: 1, name: "Sarah", action: ACTIONS[0], room: "English Cafe", time: "Just now" },
    { id: 2, name: "Raj", action: ACTIONS[1], room: "Anime Talk", time: "2m ago" },
    { id: 3, name: "Mike", action: ACTIONS[2], room: "", time: "5m ago" },
  ]);

  const listRef = useRef(null);

  // --- DYNAMIC SIMULATION EFFECT ---
  useEffect(() => {
    const interval = setInterval(() => {
      addNewActivity();
    }, 4000); // Add new item every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const addNewActivity = () => {
    const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
    const randomAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    const randomRoom = randomAction.text.includes("Lvl") ? "" : ROOMS[Math.floor(Math.random() * ROOMS.length)];

    const newActivity = {
      id: Date.now(), // Unique ID
      name: randomName,
      action: randomAction,
      room: randomRoom,
      time: "Just now",
      isNew: true, // Flag for animation
    };

    setActivities((prev) => {
      // Keep only top 5 items to prevent list from growing too long
      const updated = [newActivity, ...prev].slice(0, 5);
      return updated;
    });
  };

  return (
    <div className="bg-white dark:bg-[#151725] border border-gray-200 dark:border-slate-800/60 rounded-[2rem] p-6 h-fit w-full shadow-sm sticky top-28">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
           Happening Now
        </h3>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>
      
      <div className="relative space-y-8 pl-2" ref={listRef}>
        {/* The Vertical Line (Dashed for style) */}
        <div className="absolute left-[11px] top-3 bottom-3 w-[2px] bg-gray-200 dark:bg-slate-800" />

        {activities.map((item, index) => (
          <div 
            key={item.id} 
            className={`relative pl-10 group cursor-default transition-all duration-500 ease-out ${item.isNew ? 'animate-slide-in-right' : ''}`}
          >
            
            {/* The Timeline Dot (Avatar/Icon) */}
            <div className={`absolute -left-2 top-0 w-7 h-7 rounded-full ${item.action.color} border-4 border-white dark:border-[#151725] z-10 flex items-center justify-center text-[10px] text-white shadow-lg group-hover:scale-110 transition-transform`}>
               {/* Use first letter of name */}
               {item.name.charAt(0)}
            </div>
            
            <div className="flex flex-col">
               <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold mb-1 uppercase tracking-wide">
                 {index === 0 ? "Just Now" : item.time}
               </span>
               
               <p className="text-sm text-gray-600 dark:text-slate-300 leading-snug">
                 <span className="font-bold text-gray-900 dark:text-white hover:text-primary cursor-pointer transition-colors">
                    {item.name}
                 </span> 
                 <span className="opacity-80"> {item.action.text}</span>
                 
                 {item.room && (
                    <span className="block mt-1.5 w-fit px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700/50 text-xs font-medium text-gray-700 dark:text-indigo-300">
                        {item.room}
                    </span>
                 )}
               </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveActivityFeed;