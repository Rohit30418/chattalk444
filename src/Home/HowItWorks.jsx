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
    <section id="how-it-works" className="py-24 bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wider uppercase text-sm mb-2 block">
            Simple Process
          </span>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
            Master a language in <span className="text-primary  dark:from-indigo-400 dark:to-purple-400">3 simple steps</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            No complicated scheduling or lessons. Just real conversations with real people.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-12 relative">
          
          {/* Connector Line (Desktop Only) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-gray-200 via-indigo-200 to-gray-200 dark:from-slate-800 dark:via-indigo-900 dark:to-slate-800 -z-0"></div>

          {steps.map((step, idx) => (
            <div key={idx} className="relative flex flex-col items-center text-center group z-10">
              
              {/* Icon Circle */}
              <div className="mb-6 relative">
                {/* Glow Effect */}
                <div className={`absolute -inset-4 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-20 rounded-full blur-xl transition-opacity duration-500`}></div>
                
                {/* Icon Container */}
                <div className={`relative w-24 h-24 rounded-2xl bg-gradient-to-br ${step.color} shadow-lg flex items-center justify-center transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                  <i className={`${step.icon} text-3xl text-white`}></i>
                  
                  {/* Step Number Badge */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-700 flex items-center justify-center font-bold text-gray-900 dark:text-white shadow-sm z-20">
                    {idx + 1}
                  </div>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <button className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-full font-bold shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300">
            Start Speaking Now
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;