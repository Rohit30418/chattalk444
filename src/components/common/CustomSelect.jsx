import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Globe2 } from 'lucide-react'; 
import { languageData } from '../../utils/Language';

const CustomSelect = ({ languageSelect, value, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (languageName) => {
    setSearchTerm(languageName);
    setIsOpen(false);
    languageSelect(languageName);
  };

  const filteredLanguages = languageData.filter((lang) =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative z-50 w-full group" ref={dropdownRef}>
      {/* Label - Updated to match Host Room style */}
      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1 mb-2 block transition-colors">
        Primary Language {error && <span className="text-red-500 lowercase font-normal ml-1">({error})</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        {/* Leading Icon - New for consistency */}
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors z-10">
          <Globe2 size={18} />
        </span>

        <input
          type="text"
          placeholder="Search languages..."
          className={`
            w-full bg-slate-50 dark:bg-slate-900/50 
            border-2 text-slate-900 dark:text-slate-100 
            rounded-2xl px-5 py-3.5 pl-12 text-sm md:text-base
            focus:outline-none focus:ring-4 transition-all duration-300
            placeholder-slate-400 dark:placeholder-slate-600
            ${error 
              ? "border-red-500/50 focus:ring-red-500/10" 
              : "border-transparent dark:border-slate-800 focus:ring-indigo-500/10 focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-900"
            }
          `}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />

        {/* Chevron Icon */}
        <div 
          className="absolute inset-y-0 right-0 flex items-center pr-4 cursor-pointer text-slate-400 dark:text-slate-500 hover:text-indigo-500 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown 
            size={18} 
            className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {/* Dropdown Menu - Refined Glassmorphism */}
      {isOpen && (
        <div className="absolute mt-3 w-full bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-700/50 max-h-64 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 origin-top z-[60]">
          
          <div className="overflow-y-auto max-h-64 custom-scrollbar">
            {filteredLanguages.length > 0 ? (
              <ul className="p-2">
                {filteredLanguages.map((language) => (
                  <li key={language.code}>
                    <button
                      type="button"
                      className={`
                        w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 mb-1 last:mb-0
                        ${searchTerm === language.name 
                          ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/30' 
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:pl-6'
                        }
                      `}
                      onClick={() => handleSelect(language.name)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{language.name}</span>
                        {searchTerm === language.name && <i className="fa-solid fa-check text-xs"></i>}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-8 text-sm text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-3">
                 <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center">
                    <Search size={20} className="opacity-20" />
                 </div>
                 No languages found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;