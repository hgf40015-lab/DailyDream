import React, { useState, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { generateDreamFromSymbols } from '../services/geminiService';
import { DreamMachineResult } from '../types';
import { DreamMachineIcon, RefreshIcon, FutureIcon } from './icons/Icons';

interface SelectionPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const SelectionPill: React.FC<SelectionPillProps> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${active ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}
  >
      {label}
  </button>
);

const DreamMachine: React.FC = () => {
  const { translations, language } = useContext(LanguageContext);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [selectedSetting, setSelectedSetting] = useState<string>(translations.dmSettingForest);
  const [selectedTime, setSelectedTime] = useState<string>(translations.dmTimeNight);
  const [selectedGenre, setSelectedGenre] = useState<string>(translations.dmGenreFantasy);
  const [result, setResult] = useState<DreamMachineResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(50); // 0-100

  const allSymbols = React.useMemo(() => {
    const symbolSet = new Set<string>();
    Object.values(translations.dreamSymbols || {}).forEach((symbols: string[]) => {
      symbols.forEach(s => symbolSet.add(s));
    });
    return Array.from(symbolSet).sort();
  }, [translations.dreamSymbols]);

  const toggleSymbol = (symbol: string) => {
    setSelectedSymbols(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : prev.length < 5 ? [...prev, symbol] : prev
    );
  };

  const handleRandomize = () => {
      // Pick 3 random symbols
      const shuffled = [...allSymbols].sort(() => 0.5 - Math.random());
      setSelectedSymbols(shuffled.slice(0, 3));
      
      // Randomize settings
      const settings = [translations.dmSettingForest, translations.dmSettingSpace, translations.dmSettingCity, translations.dmSettingOcean, translations.dmSettingDesert, translations.dmSettingCastle];
      const times = [translations.dmTimeDay, translations.dmTimeNight, translations.dmTimeSunset, translations.dmTimeFuture];
      const genres = [translations.dmGenreFantasy, translations.dmGenreAdventure, translations.dmGenreHorror, translations.dmGenreRelax, translations.dmGenreMystery];
      
      setSelectedSetting(settings[Math.floor(Math.random() * settings.length)]);
      setSelectedTime(times[Math.floor(Math.random() * times.length)]);
      setSelectedGenre(genres[Math.floor(Math.random() * genres.length)]);
      setIntensity(Math.floor(Math.random() * 100));
  };

  const handleGenerate = async () => {
    if (selectedSymbols.length < 1 || !language) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const dreamSettings = {
          setting: selectedSetting,
          time: selectedTime,
          genre: selectedGenre
      };
      
      const storyResult = await generateDreamFromSymbols(selectedSymbols, language, dreamSettings);
      setResult(storyResult);
    } catch (e) {
      setError(translations.error);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px] -z-10"></div>
        <div className="w-20 h-20 text-purple-300 mx-auto mb-2 animate-spin-slow">
            <DreamMachineIcon />
        </div>
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300">{translations.dreamMachineTitle}</h2>
        <p className="text-gray-300">{translations.dreamMachineSubtitle}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Control Panel */}
          <div className="lg:col-span-4 space-y-6">
              {/* Configuration Panel */}
              <div className="bg-gray-900/60 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{translations.settings}</h3>
                      <button onClick={handleRandomize} className="text-purple-400 hover:text-purple-300 transition-colors" title={translations.randomize}>
                          <div className="w-5 h-5"><RefreshIcon /></div>
                      </button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs text-gray-500 mb-2">{translations.dmSettings}</label>
                          <div className="flex flex-wrap gap-2">
                              {[translations.dmSettingForest, translations.dmSettingSpace, translations.dmSettingCity, translations.dmSettingOcean, translations.dmSettingCastle].map(s => (
                                  <SelectionPill key={s} label={s} active={selectedSetting === s} onClick={() => setSelectedSetting(s)} />
                              ))}
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-xs text-gray-500 mb-2">{translations.dmTime}</label>
                          <div className="flex flex-wrap gap-2">
                              {[translations.dmTimeDay, translations.dmTimeNight, translations.dmTimeSunset, translations.dmTimeFuture].map(t => (
                                  <SelectionPill key={t} label={t} active={selectedTime === t} onClick={() => setSelectedTime(t)} />
                              ))}
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs text-gray-500 mb-2">{translations.dmGenre}</label>
                          <div className="flex flex-wrap gap-2">
                              {[translations.dmGenreFantasy, translations.dmGenreAdventure, translations.dmGenreHorror, translations.dmGenreRelax].map(g => (
                                  <SelectionPill key={g} label={g} active={selectedGenre === g} onClick={() => setSelectedGenre(g)} />
                              ))}
                          </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold text-gray-400 mb-2">
                            <span>{translations.intensity}</span>
                            <span className="text-purple-400">{intensity}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={intensity} 
                            onChange={(e) => setIntensity(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>
                  </div>
              </div>
          </div>

          {/* Right Panel: Symbols & Generation */}
          <div className="lg:col-span-8 flex flex-col gap-6">
                {/* Symbol Selection */}
                <div className="bg-gray-900/60 backdrop-blur-md p-6 rounded-3xl border border-purple-500/20 shadow-2xl flex-grow">
                    <h3 className="text-lg font-semibold text-purple-200 text-center mb-6 uppercase tracking-widest">{translations.selectSymbols} <span className="text-sm opacity-50">({selectedSymbols.length}/5)</span></h3>
                    <div className="flex flex-wrap gap-3 justify-center max-h-60 overflow-y-auto custom-scrollbar p-2">
                    {allSymbols.map(symbol => (
                        <button
                        key={symbol}
                        onClick={() => toggleSymbol(symbol)}
                        className={`relative group px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 border ${
                            selectedSymbols.includes(symbol)
                            ? 'bg-purple-600/80 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] transform scale-105'
                            : 'bg-gray-800/80 border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white'
                        }`}
                        >
                        <span className="relative z-10">{symbol}</span>
                        {selectedSymbols.includes(symbol) && <div className="absolute inset-0 bg-purple-400/20 blur-md rounded-lg"></div>}
                        </button>
                    ))}
                    </div>
                </div>

                <div className="flex justify-center">
                    <button
                    onClick={handleGenerate}
                    disabled={isLoading || selectedSymbols.length < 1}
                    className="w-full sm:w-auto px-12 py-4 text-xl font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-full shadow-[0_0_20px_rgba(192,38,211,0.5)] hover:shadow-[0_0_40px_rgba(192,38,211,0.7)] transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none animate-pulse-slow"
                    >
                    {isLoading ? translations.interpreting : `✨ ${translations.generateStory} ✨`}
                    </button>
                </div>
                
                {error && <p className="text-center text-red-400 mt-4 bg-red-900/20 p-2 rounded">{error}</p>}
          </div>
      </div>

      {result && (
        <div className="mt-10 relative">
           <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 blur-xl -z-10"></div>
           <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-t-3xl rounded-b-xl p-8 shadow-2xl animate-fade-in-up">
               <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 mb-6 text-center">{result.title}</h3>
               
               <div className="bg-white/5 p-6 rounded-2xl border border-white/5 mb-6">
                   <p className="text-lg text-gray-100 font-serif leading-loose italic drop-shadow-md">
                    "{result.story}"
                   </p>
               </div>
               
               <div className="flex items-start gap-4 p-4 bg-purple-900/30 rounded-xl border border-purple-500/20">
                   <div className="p-2 bg-purple-500/20 rounded-lg text-purple-300 mt-1"><FutureIcon /></div>
                   <div>
                       <h4 className="text-sm font-bold text-purple-300 uppercase tracking-wider mb-1">Interpretation</h4>
                       <p className="text-gray-300 text-sm">{result.interpretation}</p>
                   </div>
               </div>

               <div className="mt-6 flex justify-center text-2xl gap-4 opacity-50">
                   <span>✨</span><span>🌙</span><span>🔮</span>
               </div>
           </div>
        </div>
      )}
      <style>{`
        .animate-spin-slow {
            animation: spin 8s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-pulse-slow {
            animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default DreamMachine;