
import React, { createContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Language, Translations } from '../types';
import { translations } from '../constants/translations';

interface LanguageContextType {
  language: Language | null;
  setLanguage: (language: Language) => void;
  translations: Translations;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: null,
  setLanguage: () => {},
  translations: translations.en, // Default to English
});

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language | null>(() => {
    const savedLang = localStorage.getItem('app-language');
    return savedLang ? (savedLang as Language) : null;
  });

  const setLanguage = (lang: Language) => {
    localStorage.setItem('app-language', lang);
    setLanguageState(lang);
  };
  
  const currentTranslations = useMemo(() => {
    return language ? translations[language] : translations.en;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations: currentTranslations }}>
      {children}
    </LanguageContext.Provider>
  );
};
