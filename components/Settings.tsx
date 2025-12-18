
import React, { useState, useContext, useEffect } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { SettingsIcon } from './icons/Icons';
import { Theme } from '../types';

interface SettingsProps {
  onSave: (fullName: string, birthDate: string) => void;
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
}

const Settings: React.FC<SettingsProps> = ({ onSave, currentTheme, setTheme }) => {
  const { translations } = useContext(LanguageContext);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('dream-app-user-fullname') || '';
    const savedBirthDate = localStorage.getItem('dream-app-user-birthdate') || '';
    setFullName(savedName);
    setBirthDate(savedBirthDate);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim() && birthDate) {
      onSave(fullName.trim(), birthDate);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const themes: { id: Theme; label: string; color: string }[] = [
      { id: 'default', label: translations.themeDefault, color: 'bg-purple-600' },
      { id: 'nature', label: translations.themeNature, color: 'bg-green-600' },
      { id: 'ocean', label: translations.themeOcean, color: 'bg-blue-600' },
      { id: 'sunset', label: translations.themeSunset, color: 'bg-red-600' },
      { id: 'royal', label: translations.themeRoyal, color: 'bg-yellow-600' },
      { id: 'monochrome', label: translations.themeMonochrome, color: 'bg-gray-600' },
  ];

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
         <div className="w-12 h-12 text-cyan-300 mx-auto mb-2">
            <SettingsIcon />
         </div>
        <h2 className="text-3xl font-bold text-glow">{translations.settingsTitle}</h2>
        <p className="text-gray-300">{translations.settingsSubtitle}</p>
      </div>

      <form 
        onSubmit={handleSave}
        className="bg-gray-800/50 border border-purple-400/50 rounded-2xl p-8 shadow-2xl shadow-purple-500/20 w-full"
      >
        <div className="mb-6">
          <label className="block text-xl font-bold mb-2 text-white text-center" htmlFor="fullName">
            {translations.whatsYourFullName}
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={translations.enterYourFullName}
            className="w-full p-3 bg-gray-700/50 border border-purple-400/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all duration-300 text-lg text-white placeholder-gray-400 text-center"
            required
          />
        </div>

        <div className="mb-8">
            <label className="block text-xl font-bold mb-2 text-white text-center" htmlFor="birthDate">
              {translations.whatsYourBirthdate}
            </label>
            <input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full p-3 bg-gray-700/50 border border-purple-400/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all duration-300 text-lg text-white placeholder-gray-400 text-center"
              required
              max={new Date().toISOString().split("T")[0]} // Prevent selecting future dates
            />
        </div>
        
        {/* Theme Selector */}
        <div className="mb-8">
            <label className="block text-xl font-bold mb-4 text-white text-center">
                {translations.colorScheme}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {themes.map((theme) => (
                    <button
                        key={theme.id}
                        type="button"
                        onClick={() => setTheme(theme.id)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-300 ${
                            currentTheme === theme.id 
                                ? 'border-white bg-white/10 shadow-lg scale-105' 
                                : 'border-transparent bg-gray-900/40 hover:bg-gray-700/40'
                        }`}
                    >
                        <div className={`w-6 h-6 rounded-full ${theme.color} border border-white/30 shadow-inner`}></div>
                        <span className="text-sm font-medium text-gray-200">{theme.label}</span>
                    </button>
                ))}
            </div>
        </div>

        <button
          type="submit"
          disabled={!fullName.trim() || !birthDate}
          className="w-full px-8 py-3 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full shadow-lg hover:shadow-cyan-500/50 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {translations.updateInfo}
        </button>

        {showSuccess && (
            <p className="text-green-400 mt-4 text-center animate-fade-in font-bold">{translations.infoUpdated}</p>
        )}
      </form>
    </div>
  );
};

export default Settings;
