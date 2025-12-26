
import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { interpretDream } from '../services/geminiService';
import { checkLimit, incrementUsage } from '../services/limitService';
import { DreamPrediction, StoredDream } from '../types';
import { MicrophoneIcon, SummaryIcon, NextDayIcon, MoodIcon, ShareIcon, PsychologyIcon, FutureIcon, ShieldIcon, TrashIcon } from './icons/Icons';
import StreakModal from './StreakModal';

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
      
      if (result.sentiment === 'positive') setBackgroundMoodClass('bg-mood-positive');
      else if (result.sentiment === 'negative') setBackgroundMoodClass('bg-mood-negative');
      else setBackgroundMoodClass('bg-mood-neutral');

    } catch (e: any) {
        console.error(e);
        if (e.message === "API_KEY_NOT_CONFIGURED") {
            setError("API kalit topilmadi. Sozlamalarni tekshiring.");
        } else {
            setError(translations.error);
        }
    } finally {
      setIsLoading(false);
    }
  }, [dream, language, translations.error, setBackgroundMoodClass]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6 flex justify-between items-center px-2">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-900/20 px-3 py-1 rounded-full border border-cyan-500/20">
              Limit: {limitStatus.remaining} / 5
          </span>
      </div>
      
      <div className="relative mb-8">
        <textarea
          value={dream}
          onChange={(e) => setDream(e.target.value)}
          placeholder={translations.dreamPlaceholder}
          className={`w-full h-48 p-6 bg-gray-900/60 border-2 ${limitStatus.canUse ? 'border-purple-400/20' : 'border-red-500/30'} rounded-[2rem] focus:ring-2 focus:ring-cyan-400 outline-none transition-all duration-300 resize-none text-lg text-white shadow-2xl`}
          disabled={isLoading || !limitStatus.canUse}
        />
        {!limitStatus.canUse && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-[2rem] flex flex-col items-center justify-center pointer-events-none p-6 text-center">
                <p className="text-white font-bold bg-red-600 px-6 py-3 rounded-full shadow-2xl">LIMIT REACHED</p>
                <p className="text-gray-300 mt-2 text-sm">Yangi urinishlar ertaga ochiladi.</p>
            </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handleInterpret}
          disabled={isLoading || !dream.trim() || !limitStatus.canUse}
          className="px-12 py-5 text-xl font-black text-white bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {isLoading ? translations.interpreting : translations.interpretDream}
        </button>
      </div>

      {error && <p className="text-center text-red-400 mt-6 bg-red-900/20 p-4 rounded-2xl border border-red-500/20 font-bold animate-shake">{error}</p>}
      
      {prediction && !isLoading && (
          <div className="mt-12 bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-fade-in-up">
              <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-cyan-500/20 rounded-2xl text-cyan-300"><SummaryIcon /></div>
                  <h3 className="text-2xl font-black text-white">{translations.islamicInterpretation}</h3>
              </div>
              <p className="text-xl text-gray-100 leading-relaxed font-serif italic mb-8">"{prediction.generalMeaning}"</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                      <div className="flex items-center gap-3 mb-3 text-purple-300">
                          <div className="w-6 h-6"><PsychologyIcon /></div>
                          <h4 className="font-bold uppercase tracking-widest text-xs">{translations.psychologicalMeaning}</h4>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{prediction.psychologicalInsight}</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-3xl border border-cyan-500/20">
                      <div className="flex items-center gap-3 mb-3 text-cyan-300">
                          <div className="w-6 h-6"><NextDayIcon /></div>
                          <h4 className="font-bold uppercase tracking-widest text-xs">{translations.lifeAdvice}</h4>
                      </div>
                      <p className="text-white text-sm leading-relaxed font-medium">{prediction.nextDayAdvice}</p>
                  </div>
              </div>
          </div>
      )}
      
      <style>{`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
};

export default DreamInterpreter;
