import React from "react";

const languages = [
  { code: "US", name: "English (USA)", users: 12000, color: "text-blue-500" },
  { code: "GB", name: "English (UK)", users: 9500, color: "text-red-500" },
  { code: "IN", name: "Hindi (India)", users: 8700, color: "text-orange-500" },
  { code: "ES", name: "Spanish", users: 14300, color: "text-yellow-500" },
  { code: "FR", name: "French", users: 7600, color: "text-blue-600" },
  { code: "DE", name: "German", users: 5400, color: "text-gray-600" },
  { code: "IT", name: "Italian", users: 4800, color: "text-green-500" },
  { code: "PT", name: "Portuguese", users: 5200, color: "text-green-600" },
  { code: "RU", name: "Russian", users: 3900, color: "text-red-600" },
  { code: "JP", name: "Japanese", users: 6200, color: "text-red-400" },
  { code: "KR", name: "Korean", users: 7100, color: "text-blue-400" },
  { code: "CN", name: "Chinese", users: 8300, color: "text-red-500" },
];

const FeaturedLanguages = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <span className="inline-block py-1 px-2.5 sm:px-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-[10px] sm:text-xs font-bold uppercase tracking-wide mb-3">
            Global Community
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Featured <span className="text-primary dark:from-indigo-400 dark:to-purple-400">Languages</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4 sm:px-0">
            Join thousands of learners practicing these popular languages right now.
          </p>
        </div>

        {/* Grid Section */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
          {languages.map((lang, index) => (
            <div
              key={index}
              className="group relative p-4 sm:p-5 lg:p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Hover Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative z-10 flex flex-col items-center">
                
                {/* Flag Image with Shadow */}
                <div className="relative mb-3 sm:mb-4 transform group-hover:scale-110 transition-transform duration-300">
                   <div className="absolute inset-0 bg-black/20 rounded-full blur-md translate-y-2 opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
                   <img
                    src={`https://flagsapi.com/${lang.code}/flat/64.png`}
                    alt={lang.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 object-contain drop-shadow-sm"
                  />
                </div>

                {/* Language Name */}
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-center line-clamp-1">
                  {lang.name}
                </h3>

                {/* User Count */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 sm:py-1 rounded-full mt-1.5 sm:mt-2 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors w-full sm:w-auto">
                  <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-500"></span>
                  </span>
                  <span className="truncate">
                    {lang.users.toLocaleString()} <span className="hidden sm:inline">online</span>
                  </span>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Optional View All Button */}
        <div className="mt-8 sm:mt-10 lg:mt-12 text-center">
          <button className="text-sm sm:text-base text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center justify-center gap-2 mx-auto transition-colors group">
            View all 120+ languages
            <i className="fa-solid fa-arrow-right transform group-hover:translate-x-1 transition-transform text-xs sm:text-sm"></i>
          </button>
        </div>

      </div>
    </section>
  );
};

export default FeaturedLanguages;