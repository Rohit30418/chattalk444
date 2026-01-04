import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react'; 
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
    <div className="relative mb-6 z-50 w-full" ref={dropdownRef}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 transition-colors">
        Language {error && <span className="text-red-500 text-xs ml-1">({error})</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        <input
          type="text"
          placeholder="Select Language..."
          className={`
            w-full pl-4 pr-10 py-2.5 
            text-gray-900 dark:text-white
            bg-gray-50 dark:bg-slate-900 
            border rounded-xl shadow-sm outline-none transition-all duration-200
            placeholder-gray-400 dark:placeholder-slate-500
            ${error 
              ? "border-red-500 dark:border-red-500/50 focus:ring-2 focus:ring-red-500/20" 
              : "border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 hover:border-gray-300 dark:hover:border-slate-600"
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
          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown 
            size={20} 
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute mt-1 w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 origin-top scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600">
          {filteredLanguages.length > 0 ? (
            <ul className="py-1">
              {filteredLanguages.map((language) => (
                <li key={language.code}>
                  <button
                    type="button"
                    className={`
                      w-full text-left px-4 py-2.5 text-sm transition-colors duration-150
                      ${searchTerm === language.name 
                        ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium' 
                        : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }
                    `}
                    onClick={() => handleSelect(language.name)}
                  >
                    {language.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400 flex items-center justify-center gap-2">
               <Search size={14} /> No languages found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;