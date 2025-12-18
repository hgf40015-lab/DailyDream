
import React, { useState, useContext, useEffect } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { getDreamSymbolMeaning } from '../services/geminiService';
import { DreamSymbolMeaning } from '../types';
import { SummaryIcon, FutureIcon, EncyclopediaIcon } from './icons/Icons';

interface DreamDictionaryProps {
    initialSearchTerm?: string;
}

const DreamDictionary: React.FC<DreamDictionaryProps> = ({ initialSearchTerm = '' }) => {
  const { translations, language } = useContext(LanguageContext);
  const [symbol, setSymbol] = useState(initialSearchTerm);
  const [result, setResult] = useState<DreamSymbolMeaning | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-search if initialSearchTerm exists and is different from current result
  useEffect(() => {
      if (initialSearchTerm && initialSearchTerm.trim() !== '' && (!result || result.symbol.toLowerCase() !== initialSearchTerm.toLowerCase())) {
          setSymbol(initialSearchTerm);
          handleSearch(initialSearchTerm);
      }
  }, [initialSearchTerm]);

  const handleSearch = async (searchSymbol?: string) => {
    const termToSearch = searchSymbol || symbol;
    if (!termToSearch.trim() || !language) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const meaningResult = await getDreamSymbolMeaning(termToSearch, language);
      setResult(meaningResult);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(translations.error);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSymbolClick = (clickedSymbol: string) => {
    setSymbol(clickedSymbol);
    handleSearch(clickedSymbol);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-glow">{translations.encyclopediaTitle}</h2>
        <p className="text-gray-300">{translations.encyclopediaSubtitle}</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 justify-center sticky top-2 z-10 p-2 bg-black/20 backdrop-blur-sm rounded-full">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={translations.searchSymbolPlaceholder}
          className="w-full sm:max-w-md p-3 bg-gray-800/60 border-2 border-purple-400/40 rounded-full focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all duration-300 text-lg text-white placeholder-gray-400 text-center"
          disabled={isLoading}
        />
        <button
          onClick={() => handleSearch()}
          disabled={isLoading || !symbol.trim()}
          className="px-8 py-3 text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
        >
          {isLoading ? translations.interpreting : translations.searchButton}
        </button>
      </div>

      {error && <p className="text-center text-red-400 mt-4">{error}</p>}
      
      {result && (
        <div className="mt-8 bg-gray-800/50 backdrop-blur-md border border-purple-400/30 rounded-2xl p-6 shadow-2xl shadow-purple-500/10 animate-fade-in-up">
          <h3 className="text-2xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-cyan-300 text-glow">
            {result.symbol}
          </h3>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 text-cyan-300 mt-1"><SummaryIcon /></div>
              <div>
                <h4 className="text-sm font-bold text-cyan-200 uppercase tracking-wider">{translations.islamicInterpretation}</h4>
                <p className="text-lg text-white whitespace-pre-wrap">{result.islamic}</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 text-cyan-300 mt-1"><EncyclopediaIcon /></div>
              <div>
                <h4 className="text-sm font-bold text-cyan-200 uppercase tracking-wider">{translations.psychologicalMeaning}</h4>
                <p className="text-lg text-white whitespace-pre-wrap">{result.psychological}</p>
              </div>
            </div>
             <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 text-cyan-300 mt-1"><FutureIcon /></div>
              <div>
                <h4 className="text-sm font-bold text-cyan-200 uppercase tracking-wider">{translations.lifeAdvice}</h4>
                <p className="text-lg text-white whitespace-pre-wrap">{result.lifeAdvice}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 border-t border-purple-400/20 pt-6">
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {Object.entries(translations.dreamSymbols || {}).map(([letter, symbols], index) => (
            <div key={letter} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
              <h4 className="text-2xl font-bold text-cyan-300 border-b-2 border-purple-400/30 pb-1 mb-3 sticky top-0 bg-gray-900/50 backdrop-blur-sm py-2 z-0">{letter}</h4>
              <div className="flex flex-wrap gap-2">
                {(symbols as string[]).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSymbolClick(s)}
                    className="px-3 py-1 bg-gray-700/50 rounded-full text-white text-sm hover:bg-purple-500/50 hover:shadow-md hover:shadow-purple-500/20 transition-all duration-200 transform hover:-translate-y-px"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DreamDictionary;