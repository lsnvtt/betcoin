'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { createElement } from 'react';
import { ptBR, type Translations } from './pt-BR';
import { en } from './en';
import { es } from './es';

type Locale = 'pt-BR' | 'en' | 'es';

const translations: Record<Locale, Translations> = { 'pt-BR': ptBR, en, es };

const I18nContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
}>({ locale: 'pt-BR', setLocale: () => {}, t: ptBR });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pt-BR');

  useEffect(() => {
    const saved = localStorage.getItem('betcoin_locale') as Locale;
    if (saved && translations[saved]) setLocaleState(saved);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('betcoin_locale', l);
  };

  return createElement(
    I18nContext.Provider,
    { value: { locale, setLocale, t: translations[locale] } },
    children,
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}

export type { Locale, Translations };
