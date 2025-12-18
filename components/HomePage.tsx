
import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { View } from '../types';
import { getGeneralDailyPrediction } from '../services/geminiService';
import { SearchIcon } from './icons/Icons';

interface HomePageProps {
  setCurrentView: (view: View) => void;
  userFullName: string | null;
  onSearch: (term: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ setCurrentView, userFullName, onSearch }) => {
  const { translations, language } = useContext(LanguageContext);
  const [dailyPrediction, setDailyPrediction] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Default popular searches based on language
  const trendingSearches = React.useMemo(() => {
      const uzTrends = ["Suv", "Ilon", "Tish", "Uchish", "Ot", "Chaqaloq", "Olov"];
      const enTrends = ["Water", "Snake", "Teeth", "Flying", "Horse", "Baby", "Fire"];
      return language === 'uz' ? uzTrends : enTrends;
  }, [language]);

  useEffect(() => {
    const fetchPrediction = async () => {
      if (!language) return;
      
      const PREDICTION_KEY = `daily-prediction-${language}`;
      const savedPrediction = localStorage.getItem(PREDICTION_KEY);
      const now = new Date().getTime();

      if (savedPrediction) {
        const { prediction, timestamp } = JSON.parse(savedPrediction);
        if (now - timestamp < 24 * 60 * 60 * 1000) { // Less than 24 hours old
          setDailyPrediction(prediction);
          setIsLoading(false);
          return;
        }
      }

      // Fetch new prediction
      try {
        const result = await getGeneralDailyPrediction(language);
        setDailyPrediction(result.prediction);
        localStorage.setItem(PREDICTION_KEY, JSON.stringify({ prediction: result.prediction, timestamp: now }));
      } catch (error) {
        console.error(error);
        setDailyPrediction(translations.homeDailyPrediction); // Fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrediction();
  }, [language, translations.homeDailyPrediction]);

  const welcomeMessage = userFullName 
    ? translations.homeWelcome.replace('{name}', userFullName) 
    : translations.homeWelcomeGeneric;

  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(searchTerm.trim()) {
          onSearch(searchTerm);
      }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full text-center p-2 sm:p-4 animate-fade-in relative pb-10">
       <div className="mb-8 sm:mb-10 relative z-10 w-full max-w-4xl">
         <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-cyan-200 to-purple-300 text-glow animate-gradient-x leading-tight tracking-tight">
            {welcomeMessage}
         </h1>
         <p className="text-base sm:text-lg md:text-2xl text-gray-200 max-w-2xl mx-auto italic font-serif leading-relaxed drop-shadow-md px-4">
            "{isLoading ? translations.interpreting : dailyPrediction}"
         </p>
       </div>

       {/* Search Section */}
       <div className="w-full max-w-xl md:max-w-2xl mb-10 relative z-20 px-2">
           <form onSubmit={handleSearchSubmit} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur opacity-25 group-hover:opacity-50 transition-opacity duration-300"></div>
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={translations.searchPlaceholder || "Search dream meaning..."}
                    className="w-full py-3 md:py-4 pl-6 pr-14 bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-full text-base md:text-lg text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent shadow-2xl relative z-10 transition-all"
                />
                <button 
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-600 hover:bg-cyan-500 text-white p-2 md:p-2.5 rounded-full z-20 transition-colors shadow-lg"
                >
                    <div className="w-4 h-4 md:w-5 md:h-5">
                        <SearchIcon />
                    </div>
                </button>
           </form>

           {/* Trending Pills */}
           <div className="mt-6">
               <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest font-bold mb-3">{translations.trendingTitle || "Trending Dreams"}</p>
               <div className="flex flex-wrap justify-center gap-2">
                   {trendingSearches.map(tag => (
                       <button
                            key={tag}
                            onClick={() => onSearch(tag)}
                            className="px-3 py-1 md:px-4 md:py-1.5 bg-gray-800/60 hover:bg-gray-700/80 border border-white/10 rounded-full text-xs md:text-sm text-cyan-200 font-medium transition-all transform hover:scale-105 hover:border-cyan-500/30"
                       >
                           🔥 {tag}
                       </button>
                   ))}
               </div>
           </div>
       </div>

      <button
        onClick={() => setCurrentView('dreamJourney')}
        className="group relative px-8 py-3 sm:px-12 sm:py-5 text-lg sm:text-2xl font-bold text-white rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 mb-12 sm:mb-16 overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(34,211,238,0.6)]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 animate-gradient-x"></div>
        <div className="absolute inset-0 bg-white/20 group-hover:bg-white/0 transition-colors"></div>
        
        <span className="relative z-10 flex items-center gap-3 drop-shadow-md">
            <span>{translations.homeAction}</span>
            <span className="group-hover:translate-x-1 transition-transform">➔</span>
        </span>
      </button>

      {/* Onboarding / How It Works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full max-w-5xl mb-12 px-2">
          {['Write', 'Analyze', 'Insight'].map((step, idx) => (
              <div key={idx} className="bg-gray-800/40 p-6 sm:p-8 rounded-2xl border border-white/10 backdrop-blur-md hover:bg-gray-800/60 hover:border-cyan-500/30 hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 shadow-xl group">
                  <div className={`text-3xl sm:text-4xl font-black mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-br ${idx === 0 ? 'from-purple-400 to-pink-400' : idx === 1 ? 'from-cyan-400 to-blue-400' : 'from-green-400 to-emerald-400'}`}>
                      {idx + 1}
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-2 sm:mb-3 group-hover:text-cyan-200 transition-colors">{step}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm md:text-base leading-relaxed">
                      {idx === 0 && "Simply describe your dream details, feelings, and symbols."}
                      {idx === 1 && "Our AI analyzes hidden patterns, archetypes, and meanings."}
                      {idx === 2 && "Receive personalized advice and psychological clarity."}
                  </p>
              </div>
          ))}
      </div>
    </div>
  );
};

export default HomePage;
