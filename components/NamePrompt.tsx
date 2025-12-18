import React, { useState, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

interface NamePromptProps {
  onSave: (fullName: string, birthDate: string) => void;
}

const NamePrompt: React.FC<NamePromptProps> = ({ onSave }) => {
  const { translations } = useContext(LanguageContext);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim() && birthDate) {
      onSave(fullName.trim(), birthDate);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form 
        onSubmit={handleSave}
        className="bg-gray-800/50 border border-purple-400/50 rounded-2xl p-8 shadow-2xl shadow-purple-500/20 max-w-sm w-full text-center animate-fade-in"
      >
        <div className="mb-6">
          <label className="block text-2xl font-bold mb-2 text-white" htmlFor="fullName">
            {translations.whatsYourFullName}
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={translations.enterYourFullName}
            className="w-full p-3 bg-gray-700/50 border border-purple-400/30 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all duration-300 text-lg text-white placeholder-gray-400 text-center"
            autoFocus
            required
          />
        </div>

        <div className="mb-8">
            <label className="block text-xl font-bold mb-2 text-white" htmlFor="birthDate">
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

        <button
          type="submit"
          disabled={!fullName.trim() || !birthDate}
          className="px-8 py-2 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {translations.save}
        </button>
      </form>
    </div>
  );
};

export default NamePrompt;