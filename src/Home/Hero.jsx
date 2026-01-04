import React from "react";
import { Link } from "react-router-dom"; // Assuming you use react-router

const Hero = () => {
  const stats = [
    { value: "120+", label: "Languages" },
    { value: "50K+", label: "Active Learners" },
    { value: "1M+", label: "Conversations" },
  ];

  return (
    <div className="bg-gray-50 px-4 dark:bg-slate-950 transition-colors duration-300">
      <section className="relative max-w-7xl mx-auto pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
        </div>

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* LEFT CONTENT */}
            <div className="text-center lg:text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-primary/90 text-indigo-600 dark:text-white text-sm font-medium mb-6 border border-indigo-100 dark:border-primary/80">
                <i className="fa-solid fa-sparkles"></i>
                <span>Practice with native speakers</span>
              </div>

              {/* Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6 text-gray-900 dark:text-white text-balance">
                Learn languages through{" "}
                <span className="text-primary dark:from-indigo-400 dark:to-purple-400 ">
                  real conversations
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Join live voice rooms, chat with learners worldwide, and master any language naturally. No textbooks, just real practice.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link
                  to="/rooms"
                  className="inline-flex justify-center items-center gap-2 px-8 py-4 rounded-xl bg-primary text-white font-semibold shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  Browse Rooms
                  <i className="fa-solid fa-microphone"></i>
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex justify-center items-center gap-2 px-8 py-4 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200"
                >
                  How It Works
                </a>
              </div>

              {/* STATS */}
              <div className="flex items-center flex-wrap justify-center lg:justify-start gap-8 border-t border-gray-100 dark:border-slate-800 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT CONTENT (Phone Mockup) */}
            <div className="relative flex justify-center lg:justify-end mt-10 lg:mt-0">
              <div className="relative">
                
                {/* Phone Frame */}
                <div className="relative border-[8px] border-gray-900 dark:border-slate-800 w-[300px] h-[600px] bg-gray-900 dark:bg-slate-800 rounded-[3rem] shadow-2xl overflow-hidden ring-1 ring-gray-900/50">
                  
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 dark:bg-slate-800 rounded-b-2xl z-20"></div>

                  {/* Screen Content */}
                  <div className="w-full h-full bg-white dark:bg-slate-900 overflow-hidden relative flex flex-col">
                    
                    {/* App Header */}
                    <div className="pt-10 pb-4 px-6 bg-gray-50 dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 text-center">
                      <div className="w-12 h-1 bg-gray-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">Spanish Room</h3>
                      <p className="text-xs flex gap-2 items-center justify-center text-gray-500 dark:text-gray-400">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        12 learners online
                      </p>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 p-4 space-y-4 overflow-hidden bg-gray-50 dark:bg-slate-950/50">
                      <ChatBubble
                        message="¡Hola! ¿Cómo estás?"
                        sender="Maria"
                        isRight={false}
                        className="animate-[fade-in-up_0.5s_ease-out]"
                      />
                      <ChatBubble
                        message="Estoy bien, gracias! 🎉"
                        sender="You"
                        isRight={true}
                        className="animate-[fade-in-up_0.5s_ease-out_0.2s_both]"
                      />
                      <ChatBubble
                        message="¿De dónde eres?"
                        sender="Carlos"
                        isRight={false}
                        className="animate-[fade-in-up_0.5s_ease-out_0.4s_both]"
                      />
                    </div>

                    {/* Voice Indicator (Bottom) */}
                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
                      <div className="flex items-center justify-center gap-3 py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                        <div className="flex items-end gap-1 h-6">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="w-1 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-[bounce_1s_infinite]"
                              style={{
                                height: `${Math.random() * 100}%`,
                                animationDelay: `${i * 0.1}s`,
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                          Live Voice
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Badges (Outside Phone) */}
                <div className="hidden sm:block">
                  <div className="absolute top-20 -left-12 animate-[float_3s_ease-in-out_infinite]">
                    <FloatingBadge icon="fa-users" text="Join room" color="text-blue-500" />
                  </div>
                  <div className="absolute top-40 -right-8 animate-[float_4s_ease-in-out_infinite_1s]">
                    <FloatingBadge icon="fa-message" text="Say hello!" color="text-green-500" />
                  </div>
                  <div className="absolute bottom-32 -left-8 animate-[float_3.5s_ease-in-out_infinite_0.5s]">
                    <FloatingBadge icon="fa-microphone" text="Voice chat" color="text-red-500" />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

/* CHAT BUBBLE COMPONENT */
const ChatBubble = ({ message, sender, isRight, className }) => (
  <div className={`flex w-full ${isRight ? "justify-end" : "justify-start"} ${className}`}>
    <div
      className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
        isRight
          ? "bg-primary text-white rounded-br-none"
          : "bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-slate-700 rounded-bl-none"
      }`}
    >
      <p className={`text-[10px] font-bold mb-1 uppercase tracking-wide opacity-70 ${isRight ? 'text-indigo-200' : 'text-gray-400'}`}>
        {sender}
      </p>
      <p>{message}</p>
    </div>
  </div>
);

/* FLOATING BADGE COMPONENT */
const FloatingBadge = ({ icon, text, color }) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 backdrop-blur-sm">
    <div className={`w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center ${color}`}>
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <span className="text-sm font-bold text-gray-700 dark:text-white whitespace-nowrap">{text}</span>
  </div>
);

export default Hero;