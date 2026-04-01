'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation, type Locale } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES: { code: Locale; flag: string; name: string }[] = [
  { code: 'pt-BR', flag: '\ud83c\udde7\ud83c\uddf7', name: 'Portugu\u00eas' },
  { code: 'en', flag: '\ud83c\uddfa\ud83c\uddf8', name: 'English' },
  { code: 'es', flag: '\ud83c\uddea\ud83c\uddf8', name: 'Espa\u00f1ol' },
];

export function LanguageSelector() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-xl bg-white/5 border border-white/10 px-2.5 py-2 text-sm hover:bg-white/10 transition-colors"
        aria-label="Select language"
      >
        <span className="text-base leading-none">{current.flag}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-xl bg-betcoin-dark/95 backdrop-blur-xl border border-white/10 py-1 shadow-xl"
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLocale(lang.code);
                  setOpen(false);
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                  locale === lang.code
                    ? 'text-betcoin-primary bg-betcoin-primary/10'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
