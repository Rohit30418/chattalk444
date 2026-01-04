import React from 'react';
import { motion } from 'framer-motion';

const AiUnlockSection = () => {
  return (
    <section className="relative px-4 py-24 overflow-hidden bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      
    

      <div className="relative max-w-6xl mx-auto  sm:px-6 lg:px-8">
        
        {/* --- Header Section --- */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center space-x-2 mb-6 bg-blue-100 dark:bg-blue-900/30 px-4 py-1.5 rounded-full border border-blue-200 dark:border-blue-500/30">
            <i className="fa-solid fa-robot text-blue-600 dark:text-blue-400 text-sm"></i>
            <span className="text-blue-700 dark:text-blue-300 font-semibold tracking-wide text-xs uppercase">
              AI-Powered Fluency
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight text-gray-900 dark:text-white">
            Master Languages with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-500">
              AI Vanni Intelligence
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Don't wait for a partner. Practice conversation, get corrected, and improve your accent with our 24/7 AI Tutor.
          </p>
        </div>

        {/* --- The Pricing Card --- */}
        <div className="max-w-lg mx-auto">
          <motion.div 
            whileHover={{ y: -10 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative group z-10"
          >
            {/* Animated Gradient Border Glow */}
            {/* <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl blur opacity-30 dark:opacity-50 group-hover:opacity-80 transition duration-500"></div> */}
            
            <div className="relative bg-white dark:bg-[#111827] rounded-2xl p-8 md:p-10 border border-gray-200 dark:border-gray-700 shadow-2xl transition-colors duration-300">
              
              {/* Badge */}
              <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                 <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-lg shadow-lg border border-white/20 uppercase tracking-wider">
                   Lifetime Deal
                 </span>
              </div>

              {/* Card Title */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                  <i className="fa-solid fa-wand-magic-sparkles text-yellow-500 dark:text-yellow-400 text-lg"></i>
                  Unlock AI Vanni Pro
                </h3>
              </div>

              {/* Price */}
              <div className="flex flex-col items-center justify-center mb-8">
                <div className="flex items-baseline">
                  <span className="text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight">$48</span>
                  <span className="ml-2 text-xl text-gray-400 font-medium line-through decoration-red-500/70 opacity-60">$199</span>
                </div>
                <span className="text-sm text-blue-700 dark:text-blue-300 mt-2 bg-blue-100 dark:bg-blue-900/20 px-3 py-1 rounded-full font-medium">
                  One-time payment • Lifetime access
                </span>
              </div>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0px 0px 25px rgba(79, 70, 229, 0.5)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full group relative py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-bold rounded-xl transition-all duration-200 shadow-lg overflow-hidden mb-8"
              >
                {/* Button Shimmer Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>
                
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <i className="fa-solid fa-unlock-keyhole"></i>
                  Get Full Access Now
                </span>
              </motion.button>

              {/* Features List */}
              <ul className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                <FeatureRow 
                  iconClass="fa-solid fa-comments" 
                  text="Unlimited Conversational Practice" 
                  colorClass="text-blue-500 dark:text-blue-400"
                />
                <FeatureRow 
                  iconClass="fa-solid fa-microphone-lines" 
                  text="Real-time Pronunciation Scoring" 
                  colorClass="text-purple-500 dark:text-purple-400"
                />
                <FeatureRow 
                  iconClass="fa-solid fa-circle-check" 
                  text="Instant Grammar Corrections" 
                  colorClass="text-green-500 dark:text-green-400"
                />
                <FeatureRow 
                  iconClass="fa-solid fa-robot" 
                  text="Personalized AI Tutor Personality" 
                  colorClass="text-pink-500 dark:text-pink-400"
                />
              </ul>

              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-8">
                30-day money-back guarantee. No questions asked.
              </p>

            </div>
          </motion.div>
        </div>
      </div>

      {/* Internal Style for Shimmer Animation */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  );
};

// --- Sub-Component ---
const FeatureRow = ({ iconClass, text, colorClass }) => {
  return (
    <li className="flex items-start gap-4">
      <div className={`mt-1 ${colorClass}`}>
        <i className={`${iconClass} text-lg`}></i>
      </div>
      <span className="text-gray-700 dark:text-gray-300 text-sm md:text-base font-medium">{text}</span>
    </li>
  );
};

export default AiUnlockSection;