import React, { useRef } from 'react';

const EventCard = ({ title, subtitle, icon, bgGradient, tag }) => (
  <div className={`relative min-w-[280px] h-[160px] rounded-[2rem] p-6 cursor-pointer hover:scale-[1.02] transition-all duration-300 shadow-xl hover:shadow-2xl overflow-hidden group snap-start`}>
    {/* Gradient Background */}
    <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-90`}></div>
    
    {/* Abstract Shapes */}
    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <i className={`${icon} text-6xl text-white`}></i>
    </div>

    <div className="relative z-10 flex flex-col justify-between h-full text-white">
      <div className="flex justify-between items-start">
         <span className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-white/10 shadow-sm">
            {tag}
         </span>
      </div>
      <div>
        <h3 className="text-xl font-black leading-tight mb-1 tracking-tight drop-shadow-md">{title}</h3>
        <p className="text-sm opacity-90 font-medium flex items-center gap-2">
           {subtitle}
           <i className="fa-solid fa-arrow-right text-[10px] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"></i>
        </p>
      </div>
    </div>
  </div>
);

const FeaturedEvents = () => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300; // Approx card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative w-full group">
      
      {/* --- Custom Navigation Buttons (Visible on Hover) --- */}
      
      {/* Left Button */}
      <button 
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white/50 -ml-4 shadow-lg disabled:opacity-0"
      >
        <i className="fa-solid fa-chevron-left text-lg drop-shadow-md"></i>
      </button>

      {/* Right Button */}
      <button 
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white/50 -mr-2 shadow-lg"
      >
        <i className="fa-solid fa-chevron-right text-lg drop-shadow-md"></i>
      </button>


      {/* --- Scroll Container --- */}
      {/* [&::-webkit-scrollbar]:hidden hides the default scrollbar */}
      <div 
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scroll-smooth py-4 px-2 [&::-webkit-scrollbar]:hidden -mx-2 mask-linear-fade"
      >
        
        {/* 1. Feature */}
        <EventCard 
            title="Freestyle Rap Battle" 
            subtitle="Tonight @ 9 PM EST"
            icon="fa-solid fa-microphone-lines"
            bgGradient="from-violet-600 to-indigo-600"
            tag="Featured"
        />

        {/* 2. Career */}
        <EventCard 
            title="Business English" 
            subtitle="Mock Interview Prep"
            icon="fa-solid fa-briefcase"
            bgGradient="from-emerald-500 to-teal-600"
            tag="Career"
        />

        {/* 3. Social */}
        <EventCard 
            title="Anime Spoilers" 
            subtitle="Attack on Titan Debate"
            icon="fa-solid fa-dragon"
            bgGradient="from-orange-500 to-red-600"
            tag="Social"
        />

         {/* 4. Challenge */}
         <EventCard 
            title="Daily Vocab Streak" 
            subtitle="Keep your fire lit! 🔥"
            icon="fa-solid fa-fire"
            bgGradient="from-blue-500 to-cyan-500"
            tag="Challenge"
        />

        {/* 5. Tech */}
        <EventCard 
            title="React vs Vue" 
            subtitle="Tech War Room 💻"
            icon="fa-brands fa-react"
            bgGradient="from-sky-500 to-blue-700"
            tag="Tech"
        />

        {/* 6. Chill */}
        <EventCard 
            title="Lofi Study Jam" 
            subtitle="Focus Mode ON 🎧"
            icon="fa-solid fa-headphones"
            bgGradient="from-indigo-400 to-purple-500"
            tag="Chill"
        />

        {/* 7. Fun */}
        <EventCard 
            title="Stand-up Comedy" 
            subtitle="Open Mic Night 🎤"
            icon="fa-solid fa-masks-theater"
            bgGradient="from-pink-500 to-rose-600"
            tag="Fun"
        />

        {/* 8. Debate */}
        <EventCard 
            title="Global Politics" 
            subtitle="Civil Discourse Only"
            icon="fa-solid fa-earth-americas"
            bgGradient="from-slate-700 to-slate-900"
            tag="Debate"
        />

        {/* 9. Trivia */}
        <EventCard 
            title="Harry Potter Trivia" 
            subtitle="Wizards Welcome ⚡"
            icon="fa-solid fa-wand-magic-sparkles"
            bgGradient="from-amber-400 to-yellow-600"
            tag="Trivia"
        />

        {/* 10. Gaming */}
        <EventCard 
            title="Among Us Lobby" 
            subtitle="English Speakers Only"
            icon="fa-solid fa-gamepad"
            bgGradient="from-gray-600 to-gray-800"
            tag="Gaming"
        />

      </div>
    </div>
  );
};

export default FeaturedEvents;