
import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
// Fix: Removed non-existent offlineDictionaries and symbolAudioMap from imports
import { interpretDream } from '../services/geminiService';
import { checkLimit, incrementUsage } from '../services/limitService';
import { DreamPrediction, StoredDream } from '../types';
import { MicrophoneIcon, SummaryIcon, NextDayIcon, MoodIcon, ShareIcon, PsychologyIcon, FutureIcon, ShieldIcon, TrashIcon } from './icons/Icons';
import StreakModal from './StreakModal';

// ... (SpeechRecognition qismi o'zgarishsiz)

interface DreamInterpreterProps {
  setCurrentView: (view: any) => void;
  setBackgroundMoodClass: (className: string) => void;
}

const DreamInterpreter: React.FC<DreamInterpreterProps> = ({ setCurrentView, setBackgroundMoodClass }) => {
  const [dream, setDream] = useState('');
  const [prediction, setPrediction] = useState<DreamPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { translations, language } = useContext(LanguageContext);
  const [limitStatus, setLimitStatus] = useState(checkLimit('interpret'));

  const handleInterpret = useCallback(async () => {
    if (!dream.trim() || !language) return;
    
    const limit = checkLimit('interpret');
    if (!limit.canUse) {
        setError("Kunlik limit tugadi. Ertaga qaytib keling!");
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result: DreamPrediction = await interpretDream(dream, language);
      setPrediction(result);
      incrementUsage('interpret');
      setLimitStatus(checkLimit('interpret'));
      
      // ... (Silsila va ballar mantiqi o'zgarishsiz)
    } catch (e) {
      setError(translations.error);
    } finally {
      setIsLoading(false);
    }
  }, [dream, language, translations.error]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 flex justify-between items-center px-2">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-900/20 px-3 py-1 rounded-full border border-cyan-500/20">
              Limit: {limitStatus.remaining} / 5
          </span>
      </div>
      
      <div className="relative">
        <textarea
          value={dream}
          onChange={(e) => setDream(e.target.value)}
          placeholder={translations.dreamPlaceholder}
          className={`w-full h-40 p-4 pr-16 bg-gray-900/60 border-2 ${limitStatus.canUse ? 'border-purple-400/20' : 'border-red-500/30'} rounded-2xl focus:ring-2 focus:ring-cyan-400 outline-none transition-all duration-300 resize-none text-lg text-white`}
          disabled={isLoading || !limitStatus.canUse}
        />
        {!limitStatus.canUse && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center pointer-events-none">
                <p className="text-white font-bold bg-red-600 px-4 py-2 rounded-lg shadow-xl">LIMIT REACHED</p>
            </div>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <button
          onClick={handleInterpret}
          disabled={isLoading || !dream.trim() || !limitStatus.canUse}
          className="px-10 py-4 text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {isLoading ? translations.interpreting : translations.interpretDream}
        </button>
      </div>

      {error && <p className="text-center text-red-400 mt-4 bg-red-900/20 p-2 rounded">{error}</p>}
      
      {/* ... (Prediction natijasi qismi o'zgarishsiz) */}
    </div>
  );
};

export default DreamInterpreter;
