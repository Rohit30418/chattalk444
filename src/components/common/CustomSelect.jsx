import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { ChevronDown, Search, Globe2, Check, X } from 'lucide-react';
import { languageData } from '../../utils/Language';

const CustomSelect = ({
  languageSelect,
  value = '',
  error = '',
  label = 'Primary language',
  placeholder = 'Search languages...',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm(value || '');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [value]);

  const filteredLanguages = useMemo(() => {
    const text = searchTerm.trim().toLowerCase();

    if (!text) return languageData;

    return languageData.filter((language) => (
      language.name.toLowerCase().includes(text)
      || language.code?.toLowerCase?.().includes(text)
    ));
  }, [searchTerm]);

  const handleSelect = useCallback((languageName) => {
    setSearchTerm(languageName);
    setIsOpen(false);
    languageSelect?.(languageName);
  }, [languageSelect]);

  const clearSelection = useCallback((event) => {
    event.stopPropagation();

    setSearchTerm('');
    languageSelect?.('');
    inputRef.current?.focus();
    setIsOpen(true);
  }, [languageSelect]);

  return (
    <div className="relative z-[80] w-full" ref={dropdownRef}>
      <label className="mb-2 block text-sm font-black text-slate-800 dark:text-slate-200">
        {label}
      </label>

      <div className="relative">
        <span
          className={`
            pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 transition-colors
            ${error ? 'text-red-400' : 'text-slate-400 dark:text-slate-500'}
          `}
        >
          <Globe2 size={18} />
        </span>

        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full rounded-2xl border px-4 py-3.5 pl-11 pr-20 text-sm font-semibold outline-none transition-all duration-200
            bg-white text-slate-900 placeholder:text-slate-400
            dark:bg-slate-950/55 dark:text-white dark:placeholder:text-slate-600
            ${error
              ? 'border-red-400/70 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
              : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:focus:border-indigo-400/70'}
            disabled:cursor-not-allowed disabled:opacity-60
          `}
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />

        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={clearSelection}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Clear language"
            >
              <X size={15} />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-indigo-300"
            aria-label="Toggle language dropdown"
          >
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-red-500 dark:text-red-300">
          <i className="fa-solid fa-circle-exclamation text-[10px]" />
          {error}
        </p>
      )}

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full z-[120] mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0f172a]">
          <div className="border-b border-slate-100 px-3 py-2 dark:border-white/10">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              <Search size={13} />
              Select language
            </div>
          </div>

          <div className="max-h-[230px] overflow-y-auto p-2">
            {filteredLanguages.length > 0 ? (
              <ul className="space-y-1">
                {filteredLanguages.map((language) => {
                  const selected = value === language.name;

                  return (
                    <li key={language.code || language.name}>
                      <button
                        type="button"
                        className={`
                          flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-all
                          ${selected
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.06]'}
                        `}
                        onClick={() => handleSelect(language.name)}
                      >
                        <span className="truncate">{language.name}</span>

                        {selected && (
                          <Check size={15} className="shrink-0" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
                  <Search size={19} />
                </div>

                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  No languages found
                </p>

                <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
                  Try a different keyword.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;