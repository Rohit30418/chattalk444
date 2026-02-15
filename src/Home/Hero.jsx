import React from "react";
import { Link } from "react-router-dom";

const Hero = () => {
  const stats = [
    { value: "120+", label: "Languages", icon: "fa-language" },
    { value: "50K+", label: "Learners", icon: "fa-users" },
    { value: "1M+", label: "Chats", icon: "fa-comments" },
  ];

  return (
    <div className="relative py-10 bg-white dark:bg-[#0B0C15] overflow-hidden transition-colors duration-300">
      
      {/* --- BACKGROUND PATTERN --- */}
      <div className="absolute inset-0 z-0 opacity-40 dark:opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-500 opacity-20 blur-[100px]"></div>
        <div className="absolute right-0 bottom-0 -z-10 h-[400px] w-[400px] rounded-full bg-purple-500 opacity-20 blur-[120px]"></div>
      </div>

      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* --- LEFT CONTENT --- */}
          <div className="text-center lg:text-left space-y-8 max-w-2xl mx-auto lg:mx-0">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-wide animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Live Now
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Speak fluent <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 animate-gradient-x">
                in weeks.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Ditch the textbooks. Join live audio rooms to practice with native speakers and AI tutors instantly.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start w-full sm:w-auto">
              <Link
                to="/rooms"
                className="group relative inline-flex justify-center items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20"
              >
                Start Speaking
                <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </Link>
              
              <button className="group inline-flex justify-center items-center gap-3 px-8 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white rounded-2xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-white/10 transition-all">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-play text-xs ml-0.5"></i>
                </div>
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Social Proof Stats */}
            <div className="pt-8 border-t border-slate-200 dark:border-white/10 grid grid-cols-3 gap-4 sm:gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col items-center lg:items-start">
                  <h4 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {stat.value}
                  </h4>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <i className={`fa-solid ${stat.icon} opacity-50`}></i>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* --- RIGHT CONTENT (3D Phone Mockup) --- */}
          <div className="relative mt-12 lg:mt-0 lg:h-[600px] flex items-center justify-center perspective-1000">
            
            {/* Background Glow behind phone */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[600px] bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 rounded-full blur-[80px] -z-10 animate-pulse-slow"></div>

            {/* The Phone Container */}
            <div className="relative w-[320px] h-[640px] bg-slate-900 rounded-[3rem] shadow-2xl border-[8px] border-slate-900 ring-1 ring-white/20 transform rotate-y-12 hover:rotate-y-0 transition-transform duration-700 ease-out z-10 overflow-hidden">
              
              {/* Dynamic Island / Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-7 bg-black rounded-b-2xl z-50 flex justify-center items-center">
                 <div className="w-16 h-4 bg-gray-800/50 rounded-full"></div>
              </div>

              {/* Status Bar Mock */}
              <div className="absolute top-2 px-6 w-full flex justify-between text-[10px] text-white font-medium z-40 opacity-70">
                <span>9:41</span>
                <div className="flex gap-1.5">
                  <i className="fa-solid fa-signal"></i>
                  <i className="fa-solid fa-wifi"></i>
                  <i className="fa-solid fa-battery-full"></i>
                </div>
              </div>

              {/* App UI Container */}
              <div className="w-full h-full bg-white dark:bg-[#0f111a] overflow-hidden flex flex-col relative">
                
                {/* Header UI */}
                <div className="pt-12 pb-4 px-5 bg-white/80 dark:bg-[#0f111a]/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100 dark:border-white/5">
                  <div className="flex justify-between items-center mb-4">
                    <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                        <i className="fa-solid fa-chevron-left text-xs text-slate-500"></i>
                    </button>
                    <div className="flex -space-x-2">
                         {[1,2,3].map(i => <div key={i} className={`w-6 h-6 rounded-full border-2 border-white dark:border-[#0f111a] bg-indigo-${i*100 + 300}`}></div>)}
                    </div>
                    <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                        <i className="fa-solid fa-ellipsis text-xs text-slate-500"></i>
                    </button>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Spanish 101</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">🟢 12 online • Beginner</p>
                </div>

                {/* Chat Area */}
                <div className="flex-1 p-4 space-y-5 overflow-y-auto no-scrollbar pb-24 bg-slate-50 dark:bg-[#0f111a]">
                   <div className="text-center text-xs text-slate-400 my-4 font-medium uppercase tracking-widest">Today</div>
                   
                   <ChatBubble 
                     avatar="https://randomuser.me/api/portraits/women/44.jpg"
                     sender="Sarah"
                     message="¡Hola a todos! 👋"
                     time="9:41 AM"
                   />
                   <ChatBubble 
                     avatar="https://randomuser.me/api/portraits/men/32.jpg"
                     sender="Carlos"
                     message="Hola Sarah, ¿cómo estás hoy?"
                     time="9:42 AM"
                     isRight={false}
                   />
                   <ChatBubble 
                     avatar="https://randomuser.me/api/portraits/women/65.jpg"
                     sender="You"
                     message="Estoy muy bien! Practicamos? 🇪🇸"
                     time="9:43 AM"
                     isRight={true}
                     status="read"
                   />
                   
                   {/* Typing Indicator */}
                   <div className="flex items-center gap-2 text-xs text-slate-400 ml-10 animate-pulse">
                      <span>Carlos is typing...</span>
                   </div>
                </div>

                {/* Bottom Voice Control UI */}
                <div className="absolute bottom-0 w-full p-5 bg-gradient-to-t from-white via-white to-transparent dark:from-[#0f111a] dark:via-[#0f111a] z-30">
                  <div className="bg-slate-900 dark:bg-white/10 backdrop-blur-xl rounded-[2rem] p-1.5 flex items-center justify-between pr-2 shadow-2xl border border-white/10">
                     <div className="h-12 w-12 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/40 cursor-pointer hover:scale-105 transition-transform">
                        <i className="fa-solid fa-microphone"></i>
                     </div>
                     
                     {/* Audio Waveform */}
                     <div className="flex gap-0.5 items-center h-8 flex-1 justify-center px-4">
                        {[...Array(12)].map((_, i) => (
                           <div key={i} className="w-1 bg-indigo-500/50 rounded-full animate-music-bar" style={{height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s`}}></div>
                        ))}
                     </div>

                     <button className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                        <i className="fa-solid fa-hand"></i>
                     </button>
                  </div>
                </div>

              </div>
            </div>

            {/* --- FLOATING NOTIFICATIONS (Parallax Effect) --- */}
            <div className="absolute top-[20%] -left-[10%] lg:-left-[15%] z-20 animate-float-slow">
               <NotificationCard icon="fa-check" color="bg-green-500" title="Streak" subtitle="7 Days 🔥" />
            </div>
            
            <div className="absolute bottom-[25%] -right-[5%] lg:-right-[10%] z-20 animate-float-medium">
               <NotificationCard icon="fa-user-plus" color="bg-blue-500" title="New Friend" subtitle="Maria joined" />
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

/* --- SUB COMPONENTS --- */

const ChatBubble = ({ avatar, sender, message, time, isRight, status }) => (
  <div className={`flex gap-3 ${isRight ? 'flex-row-reverse' : 'flex-row'} group`}>
    <img src={avatar} alt={sender} className="w-8 h-8 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-white/10" />
    <div className={`flex flex-col ${isRight ? 'items-end' : 'items-start'} max-w-[75%]`}>
       <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed relative ${
          isRight 
            ? 'bg-indigo-600 text-white rounded-tr-none' 
            : 'bg-white dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-white/5 rounded-tl-none'
       }`}>
          {message}
       </div>
       <div className="flex gap-1 items-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-slate-400 font-medium">{time}</span>
          {isRight && status === 'read' && <i className="fa-solid fa-check-double text-[10px] text-blue-400"></i>}
       </div>
    </div>
  </div>
);

const NotificationCard = ({ icon, color, title, subtitle }) => (
  <div className="flex items-center gap-3 p-3 pr-5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-2xl shadow-xl hover:scale-105 transition-transform cursor-default">
    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white shadow-lg`}>
       <i className={`fa-solid ${icon}`}></i>
    </div>
    <div>
       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
       <p className="text-sm font-bold text-slate-900 dark:text-white">{subtitle}</p>
    </div>
  </div>
);

export default Hero;