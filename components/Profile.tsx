
import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { ProfileStats, StoredDream, DreamAnalysis } from '../types';
import { getDreamState } from '../services/geminiService';
import { ShieldIcon, PointsIcon, FireIcon } from './icons/Icons';

const DreamProfile: React.FC = () => {
  const { translations, language } = useContext(LanguageContext);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [dreamState, setDreamState] = useState<DreamAnalysis | null>(null);
  const [isStateLoading, setIsStateLoading] = useState(false);
  const [userFullName, setUserFullName] = useState<string>('Dreamer');
  const [streakDays, setStreakDays] = useState<boolean[]>([]);

  useEffect(() => {
    const name = localStorage.getItem('dream-app-user-fullname');
    if (name) setUserFullName(name);

    const processDreams = async () => {
        const savedDreamsRaw = localStorage.getItem('user-dreams');
        if (savedDreamsRaw) {
          const dreams: StoredDream[] = JSON.parse(savedDreamsRaw);
          const dreamCount = dreams.length;
          
          // Basic symbol analysis for word cloud
          const wordCounts: { [key: string]: number } = {};
          const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'from', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'is', 'was', 'be', 'of', 'for', 'with', 'my', 'me', 'men', 'va', 'bilan', 'uchun', 'bu', 'edi', 'bir'];
          
          dreams.forEach(entry => {
            const words: string[] = entry.dream.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").match(/\b(\w+)\b/g) || [];
            words.forEach(word => {
              if (!stopWords.includes(word) && isNaN(parseInt(word)) && word.length > 3) {
                wordCounts[word] = (wordCounts[word] || 0) + 1;
              }
            });
          });
          
          const sortedSymbols = Object.keys(wordCounts)
            .sort((a, b) => wordCounts[b] - wordCounts[a])
            .slice(0, 15)
            .map(word => ({ word, count: wordCounts[word] }));
          
          // Mood analysis
          const moods = { positive: 0, neutral: 0, negative: 0 };
          dreams.forEach(entry => {
              if (entry.sentiment) {
                  moods[entry.sentiment]++;
              }
          });
          
          // Rank calculation & Level
          let rank = translations.rankBeginner;
          const dreamPoints = parseInt(localStorage.getItem('dream-points') || '0', 10);
          
          if (dreamPoints >= 2000) rank = translations.rankOracle;
          else if (dreamPoints >= 1000) rank = translations.rankExpert;
          else if (dreamPoints >= 500) rank = translations.rankGuide;
          else if (dreamPoints >= 100) rank = translations.rankExplorer;

          setStats({ dreamCount, commonSymbols: sortedSymbols, moods, rank, dreamPoints });

          // Heatmap Data (Last 28 days)
          const last28Days = Array(28).fill(false);
          const today = new Date();
          dreams.forEach(d => {
              const dDate = new Date(d.date);
              const diffTime = Math.abs(today.getTime() - dDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              if (diffDays <= 28) {
                  last28Days[28 - diffDays] = true;
              }
          });
          setStreakDays(last28Days);

          // Fetch AI dream state analysis if there are recent dreams
          if (dreamCount > 0 && language && !dreamState) {
              // Only fetch if not already fetched to save API calls in this session
              setIsStateLoading(true);
              try {
                const recentDreams = dreams.slice(-5);
                const state = await getDreamState(recentDreams, language);
                setDreamState(state);
              } catch (error) {
                console.error("Failed to fetch dream state", error);
              } finally {
                setIsStateLoading(false);
              }
          }

        } else {
            setStats({ dreamCount: 0, commonSymbols: [], moods: { positive: 0, neutral: 0, negative: 0 }, rank: translations.rankBeginner, dreamPoints: 0 });
            setStreakDays(Array(28).fill(false));
        }
    };
    processDreams();
  }, [translations, language]);

  const totalMoods = stats ? stats.moods.positive + stats.moods.neutral + stats.moods.negative : 0;
  const getPercentage = (count: number) => {
    return totalMoods > 0 ? ((count / totalMoods) * 100).toFixed(0) : 0;
  }

  // Level Logic
  const currentPoints = stats?.dreamPoints || 0;
  const level = Math.floor(currentPoints / 100) + 1;
  const nextLevelPoints = level * 100;
  const progressPercent = Math.min(100, ((currentPoints % 100) / 100) * 100);

  return (
    <div className="max-w-5xl mx-auto pb-10">
      
      {/* 1. HERO USER CARD */}
      <div className="relative mb-8 overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-white/10 bg-gray-900/40 backdrop-blur-xl shadow-2xl animate-fade-in-up group">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-cyan-900/40 opacity-50 group-hover:opacity-70 transition-opacity duration-1000"></div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px]"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center p-6 md:p-8 gap-6 md:gap-8">
              {/* Avatar / Rank Icon */}
              <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-gray-800 to-black border-4 border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                      <span className="text-4xl md:text-5xl">🧙‍♂️</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-gray-900 border border-yellow-500/50 text-yellow-400 text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-lg flex items-center gap-1">
                      <span>lvl</span>
                      <span className="text-base md:text-lg">{level}</span>
                  </div>
              </div>

              {/* User Info & Progress */}
              <div className="flex-grow text-center md:text-left w-full">
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1 truncate">{userFullName}</h2>
                  <p className="text-cyan-300 font-bold uppercase tracking-widest text-xs md:text-sm mb-4">{stats?.rank}</p>
                  
                  {/* XP Bar */}
                  <div className="relative w-full h-3 md:h-4 bg-gray-800 rounded-full overflow-hidden shadow-inner border border-white/5">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 transition-all duration-1000 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                  </div>
                  <div className="flex justify-between text-[10px] md:text-xs text-gray-400 mt-2 font-mono">
                      <span>{currentPoints} XP</span>
                      <span>{nextLevelPoints} XP Next</span>
                  </div>
              </div>

              {/* Quick Stats Grid inside Hero */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 w-full md:w-auto md:min-w-[200px]">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center backdrop-blur-md">
                      <div className="text-green-400 text-lg mb-1"><PointsIcon /></div>
                      <div className="text-xl md:text-2xl font-bold text-white">{stats?.dreamCount}</div>
                      <div className="text-[9px] md:text-[10px] text-gray-400 uppercase">{translations.totalDreams}</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center backdrop-blur-md">
                      <div className="text-orange-400 text-lg mb-1"><FireIcon /></div>
                      {/* Mock streak for demo if not in local storage correctly calculated yet */}
                      <div className="text-xl md:text-2xl font-bold text-white">3</div>
                      <div className="text-[9px] md:text-[10px] text-gray-400 uppercase">{translations.streak}</div>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 2. ACTIVITY HEATMAP */}
          <div className="lg:col-span-2 bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-6 shadow-xl animate-fade-in-up delay-100">
              <h3 className="text-lg font-bold text-gray-200 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  {translations.consistency} (28 Days)
              </h3>
              <div className="grid grid-cols-7 gap-1.5 md:gap-3">
                  {streakDays.map((active, idx) => (
                      <div 
                        key={idx} 
                        className={`aspect-square rounded md:rounded-lg transition-all duration-500 hover:scale-110 ${
                            active 
                            ? 'bg-gradient-to-br from-green-400 to-emerald-600 shadow-[0_0_10px_rgba(74,222,128,0.4)] border border-green-300/20' 
                            : 'bg-gray-800/50 border border-white/5'
                        }`}
                        title={active ? translations.logged : translations.missed}
                      ></div>
                  ))}
              </div>
              <div className="mt-4 flex justify-end gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-800/50 rounded"></div>
                      <span>{translations.missed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>{translations.logged}</span>
                  </div>
              </div>
          </div>

          {/* 3. MOOD ANALYSIS (Circular) */}
          <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl animate-fade-in-up delay-200 flex flex-col justify-center">
              <h3 className="text-lg font-bold text-gray-200 mb-6 text-center">{translations.moodChartTitle}</h3>
              {totalMoods > 0 ? (
                  <div className="space-y-5">
                      {[
                          { label: translations.positive, count: stats?.moods.positive || 0, color: 'bg-green-500', text: 'text-green-400' },
                          { label: translations.neutral, count: stats?.moods.neutral || 0, color: 'bg-gray-500', text: 'text-gray-400' },
                          { label: translations.negative, count: stats?.moods.negative || 0, color: 'bg-red-500', text: 'text-red-400' }
                      ].map((mood) => (
                          <div key={mood.label}>
                              <div className="flex justify-between text-xs font-bold mb-1 px-1">
                                  <span className="text-gray-300">{mood.label}</span>
                                  <span className={mood.text}>{getPercentage(mood.count)}%</span>
                              </div>
                              <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${mood.color} shadow-[0_0_10px_currentColor] opacity-80`} 
                                    style={{ width: `${getPercentage(mood.count)}%` }}
                                  ></div>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-center text-gray-500 py-10">{translations.noMoodData}</p>
              )}
          </div>

          {/* 4. SYMBOL CLOUD */}
          <div className="lg:col-span-2 bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl animate-fade-in-up delay-300 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
                <h3 className="text-lg font-bold text-gray-200 mb-6 uppercase tracking-wider">{translations.commonSymbols}</h3>
                
                {stats && stats.commonSymbols.length > 0 ? (
                    <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                        {stats.commonSymbols.map((symbol, idx) => {
                            // Dynamic sizing classes aren't reliable with arbitrary values in standard config, using inline style for font size
                            const size = 0.8 + (symbol.count / (stats.commonSymbols[0].count || 1)) * 1.5;
                            const colors = [
                                'bg-purple-500/20 text-purple-200 border-purple-500/30',
                                'bg-cyan-500/20 text-cyan-200 border-cyan-500/30',
                                'bg-pink-500/20 text-pink-200 border-pink-500/30',
                                'bg-blue-500/20 text-blue-200 border-blue-500/30',
                            ];
                            const styleClass = colors[idx % colors.length];

                            return (
                                <span 
                                    key={symbol.word} 
                                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full border backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-default ${styleClass}`}
                                    style={{ fontSize: `${Math.max(0.7, Math.min(size, 2))}rem` }}
                                >
                                    #{symbol.word}
                                    <span className="ml-2 opacity-50 text-[0.6em]">{symbol.count}</span>
                                </span>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">
                        <p>{translations.noDreams}</p>
                    </div>
                )}
          </div>

          {/* 5. AI DREAM STATE CARD */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-8 shadow-xl animate-fade-in-up delay-300 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-4 relative z-10">{translations.dreamState}</h3>
                
                {isStateLoading ? (
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="text-xs text-indigo-300">{translations.analyzingPsyche}</span>
                    </div>
                ) : dreamState ? (
                    <div className="relative z-10">
                        <div className="text-4xl mb-3">{dreamState.state === 'good' ? '✨' : dreamState.state === 'warning' ? '⚠️' : dreamState.state === 'warm' ? '🔥' : '🌑'}</div>
                        <p className="text-2xl font-black text-white capitalize mb-3 drop-shadow-md">{dreamState.state}</p>
                        <p className="text-sm text-indigo-100 leading-relaxed opacity-90">"{dreamState.reason}"</p>
                    </div>
                ) : (
                    <p className="text-gray-400 relative z-10 text-sm">{translations.unlockPsyche}</p>
                )}
          </div>

      </div>
    </div>
  );
};

export default DreamProfile;
