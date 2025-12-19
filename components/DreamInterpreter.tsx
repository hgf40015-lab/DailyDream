
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
    // Reset background when component mounts
    setBackgroundMoodClass('bg-mood-neutral');
    
    return () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        setBackgroundMoodClass('bg-mood-neutral');
        // Stop audio on unmount
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
  }, [setBackgroundMoodClass]);

  // Automatic translation effect when language changes
  useEffect(() => {
    const translateResult = async () => {
        if (prediction && activeDreamText && language && language !== lastLanguageRef.current) {
            setIsLoading(true);
            try {
                // Re-interpret the SAME dream in the NEW language (UI update only)
                const result: DreamPrediction = await interpretDream(activeDreamText, language);
                setPrediction(result);
                if (result.offline) setIsOfflineResult(true);
                else setIsOfflineResult(false);
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
      // Stop existing audio
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
                  audioRef.current.play().catch(e => console.warn("Audio autoplay blocked or failed:", e));
                  break; // Only play the first matching symbol sound
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

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

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

      if (result.offline) {
          setIsOfflineResult(true);
      } else {
          setIsOfflineResult(false);
          // Only save to history if it's a real AI result to avoid cluttering with generic messages
          const savedDreams = safeJSONParse('user-dreams', []);
          const newDreamEntry: StoredDream = { 
            id: Date.now().toString(), 
            date: new Date().toISOString(), 
            dream, 
            sentiment: result.sentiment 
          };
          const updatedDreams = [...savedDreams, newDreamEntry];
          localStorage.setItem('user-dreams', JSON.stringify(updatedDreams));

          // Add points
          const currentPoints = parseInt(localStorage.getItem('dream-points') || '0', 10);
          const newPoints = currentPoints + 10;
          localStorage.setItem('dream-points', newPoints.toString());
      }
      
      playSymbolSound(dream);
      
      // Streak Logic
      const streakData = safeJSONParse('dream-streak', { lastDate: null, count: 0 });
      const todayStr = new Date().toISOString().split('T')[0];
      const lastDateStr = streakData.lastDate ? streakData.lastDate.split('T')[0] : null;
      
      if (lastDateStr !== todayStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastDateStr === yesterdayStr) {
            streakData.count++;
        } else {
            streakData.count = 1;
        }
        streakData.lastDate = new Date().toISOString();
      }
      
      if (streakData.count === 7 && lastDateStr !== todayStr) {
        setShowStreakModal(true);
      }
      localStorage.setItem('dream-streak', JSON.stringify(streakData));
      
    } catch (e) {
      setError(translations.error);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [dream, language, translations.error, setBackgroundMoodClass]);

  const handleMicClick = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
          recognition.lang = language || 'en-US';
          recognition.onstart = () => setIsListening(true);
          recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results).map((result: any) => result[0]).map((result: any) => result.transcript).join('');
            setDream(prev => prev + (prev ? ' ' : '') + transcript);
            setBackgroundMoodClass(analyzeMood(transcript));
          };
          recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
          };
          recognition.onend = () => setIsListening(false);
          recognition.start();
      } catch (e) {
          console.error("Microphone start failed", e);
          setIsListening(false);
      }
    }
  };

  const handleShare = () => {
    if (!prediction) return;
    const shareText = `
    ${translations.predictionTitle}:
    ${prediction.story}
    
    ${translations.generalMeaning}: ${prediction.generalMeaning}
    ${translations.nextDayAdvice}: ${prediction.nextDayAdvice}
    ${translations.luckPercentage}: ${prediction.luckPercentage}%
    
    Via ${translations.appTitle}
    `.trim();

    if (navigator.share) {
        navigator.share({
            title: translations.predictionTitle,
            text: shareText,
        }).catch(console.error);
    } else {
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
          className="w-full h-40 p-4 pr-16 bg-gray-800/60 border-2 border-purple-400/40 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all duration-300 resize-none text-lg text-white placeholder-gray-400"
          disabled={isLoading}
        />
        
        <div className="absolute top-2 right-2 flex flex-col gap-2">
            {dream && (
                <button
                    onClick={handleClearText}
                    className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/80 text-gray-300 transition-colors"
                >
                    <span className="w-5 h-5 block"><TrashIcon /></span>
                </button>
            )}
            
            {recognition && (
            <button
                onClick={handleMicClick}
                className={`p-2 rounded-full transition-all duration-300 shadow-lg ${isListening ? 'bg-red-500 text-white animate-pulse ring-2 ring-red-400' : 'bg-purple-500/80 text-white hover:bg-purple-600'}`}
                disabled={isLoading}
            >
                <MicrophoneIcon />
            </button>
            )}
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center justify-center gap-2">
        <button
          onClick={handleInterpret}
          disabled={isLoading || !dream.trim()}
          className="px-10 py-4 text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
        >
          {isLoading ? (
              <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {translations.interpreting}
              </span>
          ) : isListening ? translations.listening : translations.interpretDream}
        </button>
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
             <div className="w-3 h-3"><ShieldIcon /></div>
             <span>Your dreams are private and anonymous.</span>
        </div>
      </div>

      {error && <p className="text-center text-red-400 mt-4 bg-red-900/20 p-2 rounded">{error}</p>}
      
      {isOfflineResult && (
          <div className="mt-4 p-3 bg-yellow-900/50 border border-yellow-400/50 rounded-lg text-center text-yellow-200 animate-pulse">
              ⚠️ Diqqat: Tizim hozircha cheklangan rejimda ishlamoqda. Iltimos, Vercel-da API_KEY to'g'ri kiritilganini va sayt Redeploy qilinganini tekshiring.
          </div>
      )}

      {prediction && (
        <div className="relative mt-8 bg-gray-800/50 backdrop-blur-md border border-purple-400/30 rounded-3xl p-6 md:p-8 shadow-2xl shadow-purple-500/10 animate-fade-in-up">
          <div className="absolute top-4 right-4">
            <button onClick={handleShare} title={translations.share} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10">
              <ShareIcon />
            </button>
             {copiedTooltipVisible && (
              <div className="absolute top-full mt-2 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg border border-gray-700">
                {translations.copiedToClipboard}
              </div>
            )}
          </div>
          
          <h3 className="text-3xl font-bold text-center mb-8 text-glow bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-cyan-300">
            {translations.predictionTitle}
          </h3>
          
          <div className="space-y-8">
             <div className="bg-gray-900/40 p-6 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 text-purple-400"><FutureIcon /></div>
                    <h4 className="text-sm font-bold text-purple-300 uppercase tracking-wider">{translations.mysticalStory}</h4>
                </div>
                <p className="text-lg text-gray-100 italic font-serif leading-relaxed">"{prediction.story}"</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-cyan-900/30 rounded-full flex items-center justify-center text-cyan-300 mt-1 border border-cyan-500/30"><SummaryIcon /></div>
                    <div>
                      <h4 className="text-sm font-bold text-cyan-200 uppercase tracking-wider mb-1">{translations.generalMeaning}</h4>
                      <p className="text-gray-200">{prediction.generalMeaning}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-900/30 rounded-full flex items-center justify-center text-green-300 mt-1 border border-green-500/30"><NextDayIcon /></div>
                    <div>
                      <h4 className="text-sm font-bold text-green-200 uppercase tracking-wider mb-1">{translations.nextDayAdvice}</h4>
                      <p className="text-gray-200">{prediction.nextDayAdvice}</p>
                    </div>
                  </div>

                   <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-pink-900/30 rounded-full flex items-center justify-center text-pink-300 mt-1 border border-pink-500/30"><PsychologyIcon /></div>
                    <div>
                      <h4 className="text-sm font-bold text-pink-200 uppercase tracking-wider mb-1">{translations.psychologicalInsight}</h4>
                      <p className="text-gray-200">{prediction.psychologicalInsight}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-300 mt-1 border border-yellow-500/30"><MoodIcon /></div>
                    <div className="w-full">
                      <h4 className="text-sm font-bold text-yellow-200 uppercase tracking-wider mb-1">{translations.luckPercentage}</h4>
                      <div className="w-full bg-gray-700 rounded-full h-5 mt-1 relative overflow-hidden shadow-inner">
                          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${prediction.luckPercentage}%` }}>
                          </div>
                          <span className="absolute inset-0 flex items-center justify-center font-bold text-xs text-white drop-shadow-md">{prediction.luckPercentage}%</span>
                      </div>
                    </div>
                  </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DreamInterpreter;
