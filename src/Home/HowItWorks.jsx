import React from "react";

const steps = [
  {
    title: "Join a Room",
    desc: "Browse dozens of active audio rooms. Filter by language or topic and jump into a conversation instantly.",
    icon: "fa-solid fa-right-to-bracket",
    color: "from-blue-500 to-cyan-400",
  },
  {
    title: "Speak & Listen",
    desc: "Unmute your mic to practice speaking, or just listen in. Connect with native speakers and learners alike.",
    icon: "fa-solid fa-comments",
    color: "from-indigo-500 to-purple-500",
  },
  {
    title: "Level Up",
    desc: "Build confidence through daily practice. Track your progress and become fluent naturally over time.",
    icon: "fa-solid fa-chart-line",
    color: "from-pink-500 to-rose-500",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wider uppercase text-xs sm:text-sm mb-2 block">
            Simple Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Master a language in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400">3 simple steps</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 px-2 sm:px-0">
            No complicated scheduling or lessons. Just real conversations with real people.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-10 sm:gap-12 relative">
          
          {/* Connector Line (Desktop Only) */}
          <div className="hidden md:block absolute top-10 lg:top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-gray-200 via-indigo-200 to-gray-200 dark:from-slate-800 dark:via-indigo-900 dark:to-slate-800 -z-0"></div>

          {steps.map((step, idx) => (
            <div key={idx} className="relative flex flex-col items-center text-center group z-10">
              
              {/* Icon Circle */}
              <div className="mb-5 sm:mb-6 relative">
                {/* Glow Effect */}
                <div className={`absolute -inset-3 sm:-inset-4 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-20 rounded-full blur-xl transition-opacity duration-500`}></div>
                
                {/* Icon Container */}
                <div className={`relative w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br ${step.color} shadow-lg flex items-center justify-center transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                  <i className={`${step.icon} text-2xl lg:text-3xl text-white`}></i>
                  
                  {/* Step Number Badge */}
                  <div className="absolute -top-2 -right-2 lg:-top-3 lg:-right-3 w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-700 flex items-center justify-center font-bold text-xs lg:text-sm text-gray-900 dark:text-white shadow-sm z-20">
                    {idx + 1}
                  </div>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {step.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 sm:mt-16 lg:mt-20 text-center">
          <button className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300">
            Start Speaking Now
            <i className="fa-solid fa-arrow-right text-xs sm:text-sm"></i>
          </button>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;