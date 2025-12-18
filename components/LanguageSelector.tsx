
import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { Language } from '../types';

const languages: { code: Language; name: string, flag: string }[] = [
  { code: 'uz', name: 'O\'zbekcha', flag: '🇺🇿' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];

interface LanguageSelectorProps {
  onClose: () => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onClose }) => {
  const { setLanguage, translations } = useContext(LanguageContext);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/50 border border-purple-400/50 rounded-2xl p-8 shadow-2xl shadow-purple-500/20 max-w-md w-full text-center animate-fade-in">
        <h2 className="text-3xl font-bold mb-6 text-white">{translations.selectLanguage}</h2>
        <div className="grid grid-cols-2 gap-4">
          {languages.map(({ code, name, flag }) => (
            <button
              key={code}
              onClick={() => handleSelect(code)}
              className="p-4 bg-gray-700/50 rounded-lg text-white text-lg hover:bg-purple-500/50 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-1"
            >
              <span className="text-2xl mr-2">{flag}</span> {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;