
import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { interpretDream, offlineDictionaries, symbolAudioMap } from '../services/geminiService';
import { DreamPrediction, StoredDream } from '../types';
import { MicrophoneIcon, SummaryIcon, NextDayIcon, MoodIcon, ShareIcon, PsychologyIcon, FutureIcon, ShieldIcon, TrashIcon } from './icons/Icons';
import StreakModal from './StreakModal';

// Safely define SpeechRecognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

interface DreamInterpreterProps {
  setCurrentView: (view: any) => void;
  setBackgroundMoodClass: (className: string) => void;
}

const DreamInterpreter: React.FC<DreamInterpreterProps> = ({ setCurrentView, setBackgroundMoodClass }) => {
  const [dream, setDream] = useState('');
  const [activeDreamText, setActiveDreamText] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<DreamPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineResult, setIsOfflineResult] = useState(false);
  const { translations, language } = useContext(LanguageContext);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [copiedTooltipVisible, setCopiedTooltipVisible] = useState(false);
  
  const typingTimeoutRef = useRef<number | null>(null);
  const lastLanguageRef = useRef<string | null>(language);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper to safely parse JSON from localStorage
  const safeJSONParse = (key: string, fallback: any) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.error(`Error parsing localStorage key "${key}":`, e);
      return fallback;
    }
  };

  useEffect(() => {
    setBackgroundMoodClass('bg-mood-neutral');
    return () => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setBackgroundMoodClass('bg-mood-neutral');
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
  }, [setBackgroundMoodClass]);

  useEffect(() => {
    const translateResult = async () => {
        if (prediction && activeDreamText && language && language !== lastLanguageRef.current) {
            setIsLoading(true);
            try {
                const result: DreamPrediction = await interpretDream(activeDreamText, language);
                setPrediction(result);
                setIsOfflineResult(!!result.offline);
            } catch (e) {
                console.error("Translation refresh failed", e);
            } finally {
                setIsLoading(false);
                lastLanguageRef.current = language;
            }
        } else {
            lastLanguageRef.current = language;
        }
    };
    translateResult();
  }, [language, prediction, activeDreamText]);

  const playSymbolSound = (text: string) => {
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
      }
      const dreamWords = text.toLowerCase().match(/\b(\w+)\b/g) || [];
      for (const word of dreamWords) {
          if (symbolAudioMap[word]) {
              try {
                  audioRef.current = new Audio(symbolAudioMap[word]);
                  audioRef.current.volume = 0.5;
                  audioRef.current.play().catch(e => console.warn("Audio blocked:", e));
                  break; 
              } catch (e) {
                  console.error("Audio creation failed", e);
              }
          }
      }
  };

  const analyzeMood = useCallback((text: string) => {
    if (!language) return 'bg-mood-neutral';
    const dictionary = offlineDictionaries[language] || offlineDictionaries.en!;
    const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
    let positiveScore = 0;
    let negativeScore = 0;
    words.forEach(word => {
        if (dictionary.positiveWords.includes(word)) positiveScore++;
        if (dictionary.negativeWords.includes(word)) negativeScore++;
    });
    if (positiveScore > negativeScore) return 'bg-mood-positive';
    if (negativeScore > positiveScore) return 'bg-mood-negative';
    return 'bg-mood-neutral';
  }, [language]);

  const handleDreamTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setDream(newText);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      const moodClass = analyzeMood(newText);
      setBackgroundMoodClass(moodClass);
    }, 500);
  };

  const handleClearText = () => {
      setDream('');
      setPrediction(null);
      setActiveDreamText(null);
      setBackgroundMoodClass('bg-mood-neutral');
  };
  
  const handleInterpret = useCallback(async () => {
    if (!dream.trim() || !language) return;
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    setIsOfflineResult(false);

    try {
      const result: DreamPrediction = await interpretDream(dream, language);
      setPrediction(result);
      setActiveDreamText(dream);
      lastLanguageRef.current = language;
      setIsOfflineResult(!!result.offline);

      if (!result.offline) {
          const savedDreams = safeJSONParse('user-dreams', []);
          const newDreamEntry: StoredDream = { 
            id: Date.now().toString(), 
            date: new Date().toISOString(), 
            dream, 
            sentiment: result.sentiment 
          };
          localStorage.setItem('user-dreams', JSON.stringify([...savedDreams, newDreamEntry]));
          const currentPoints = parseInt(localStorage.getItem('dream-points') || '0', 10);
          localStorage.setItem('dream-points', (currentPoints + 10).toString());
      }
      playSymbolSound(dream);
      
      const streakData = safeJSONParse('dream-streak', { lastDate: null, count: 0 });
      const todayStr = new Date().toISOString().split('T')[0];
      const lastDateStr = streakData.lastDate ? streakData.lastDate.split('T')[0] : null;
      if (lastDateStr !== todayStr) {
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (lastDateStr === yesterdayStr) streakData.count++;
        else streakData.count = 1;
        streakData.lastDate = new Date().toISOString();
      }
      if (streakData.count === 7 && lastDateStr !== todayStr) setShowStreakModal(true);
      localStorage.setItem('dream-streak', JSON.stringify(streakData));
    } catch (e) {
      setError(translations.error);
    } finally {
      setIsLoading(false);
    }
  }, [dream, language, translations.error, setBackgroundMoodClass]);

  const handleMicClick = () => {
    if (!recognition) {
      alert("Speech recognition not supported.");
      return;
    }
    if (isListening) { recognition.stop(); setIsListening(false); }
    else {
      try {
          recognition.lang = language || 'en-US';
          recognition.onstart = () => setIsListening(true);
          recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results).map((result: any) => result[0]).map((result: any) => result.transcript).join('');
            setDream(prev => prev + (prev ? ' ' : '') + transcript);
          };
          recognition.onerror = () => setIsListening(false);
          recognition.onend = () => setIsListening(false);
          recognition.start();
      } catch (e) { setIsListening(false); }
    }
  };

  const handleShare = () => {
    if (!prediction) return;
    const shareText = `${translations.predictionTitle}:\n${prediction.story}\n\n${translations.generalMeaning}: ${prediction.generalMeaning}\n${translations.nextDayAdvice}: ${prediction.nextDayAdvice}\nVia ${translations.appTitle}`.trim();
    if (navigator.share) navigator.share({ title: translations.predictionTitle, text: shareText }).catch(console.error);
    else {
        navigator.clipboard.writeText(shareText).then(() => {
            setCopiedTooltipVisible(true);
            setTimeout(() => setCopiedTooltipVisible(false), 2000);
        });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {showStreakModal && <StreakModal onClose={() => setShowStreakModal(false)} />}
      <div className="relative">
        <textarea
          value={dream}
          onChange={handleDreamTextChange}
          placeholder={translations.dreamPlaceholder}
          className="w-full h-40 p-4 pr-16 bg-gray-900/60 border-2 border-purple-400/20 rounded-2xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition-all duration-300 resize-none text-lg text-white placeholder-gray-500"
          disabled={isLoading}
        />
        <div className="absolute top-2 right-2 flex flex-col gap-2">
            {dream && (
                <button onClick={handleClearText} className="p-2 rounded-full bg-gray-700/50 hover:bg-red-500/30 text-gray-300 transition-colors">
                    <span className="w-5 h-5 block"><TrashIcon /></span>
                </button>
            )}
            {recognition && (
            <button onClick={handleMicClick} className={`p-2 rounded-full transition-all shadow-lg ${isListening ? 'bg-red-500 text-white animate-pulse ring-2 ring-red-400' : 'bg-purple-500/60 text-white hover:bg-purple-500'}`} disabled={isLoading}>
                <MicrophoneIcon />
            </button>
            )}
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <button
          onClick={handleInterpret}
          disabled={isLoading || !dream.trim()}
          className="px-10 py-4 text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:scale-100"
        >
          {isLoading ? (
              <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {translations.interpreting}
              </span>
          ) : isListening ? translations.listening : translations.interpretDream}
        </button>
        <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase tracking-widest mt-2 opacity-60">
             <div className="w-3 h-3"><ShieldIcon /></div>
             <span>Privacy First • AI Analysis</span>
        </div>
      </div>

      {error && <p className="text-center text-red-400 mt-4 bg-red-900/20 p-2 rounded">{error}</p>}
      
      {isOfflineResult && (
          <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg text-center text-yellow-200 text-xs animate-pulse">
              ⚠️ {translations.offlineInterpretationNotice}
          </div>
      )}

      {prediction && (
        <div className="relative mt-8 bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 md:p-10 shadow-2xl animate-fade-in-up">
          <div className="absolute top-6 right-6">
            <button onClick={handleShare} className="p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/10 relative">
              <ShareIcon />
              {copiedTooltipVisible && (
                <div className="absolute top-full mt-2 right-0 bg-black text-white text-[10px] px-2 py-1 rounded border border-white/20 whitespace-nowrap z-50">
                    {translations.copiedToClipboard}
                </div>
              )}
            </button>
          </div>
          
          <div className="text-center mb-10">
              <div className="inline-block px-4 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-black text-purple-300 uppercase tracking-[0.2em] mb-4">
                  {translations.predictionTitle}
              </div>
              <p className="text-2xl md:text-3xl text-white font-serif italic leading-snug max-w-2xl mx-auto drop-shadow-lg">
                "{prediction.story}"
              </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
               <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex gap-4">
                  <div className="w-10 h-10 flex-shrink-0 bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-300 border border-cyan-500/20"><SummaryIcon /></div>
                  <div>
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">{translations.generalMeaning}</h4>
                    <p className="text-sm text-gray-200 leading-relaxed">{prediction.generalMeaning}</p>
                  </div>
                </div>

                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex gap-4">
                  <div className="w-10 h-10 flex-shrink-0 bg-green-500/20 rounded-xl flex items-center justify-center text-green-300 border border-green-500/20"><NextDayIcon /></div>
                  <div>
                    <h4 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-1">{translations.nextDayAdvice}</h4>
                    <p className="text-sm text-gray-200 leading-relaxed">{prediction.nextDayAdvice}</p>
                  </div>
                </div>

                 <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex gap-4">
                  <div className="w-10 h-10 flex-shrink-0 bg-pink-500/20 rounded-xl flex items-center justify-center text-pink-300 border border-pink-500/20"><PsychologyIcon /></div>
                  <div>
                    <h4 className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-1">{translations.psychologicalInsight}</h4>
                    <p className="text-sm text-gray-200 leading-relaxed">{prediction.psychologicalInsight}</p>
                  </div>
                </div>

                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-3 px-1">
                        <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-widest">{translations.luckPercentage}</h4>
                        <span className="text-sm font-black text-white">{prediction.luckPercentage}%</span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-2 relative overflow-hidden">
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: `${prediction.luckPercentage}%` }}></div>
                    </div>
                </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DreamInterpreter;
