import React, { useContext, useEffect, useState } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { PublicDreamsIcon, SendIcon } from './icons/Icons';
import { getCountryDreamStats } from '../services/geminiService';
import { CountryDreamStats } from '../types';

const PublicDreams: React.FC = () => {
    const { translations, language } = useContext(LanguageContext);
    const [country, setCountry] = useState('');
    const [stats, setStats] = useState<CountryDreamStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial Default Data (Global)
    const defaultStats: CountryDreamStats = {
        country: translations.global || 'Global',
        trends: [
            { theme: 'Suv (Water)', percentage: 28 },
            { theme: 'Ilon (Snake)', percentage: 21 },
            { theme: 'Uchish (Flying)', percentage: 14 },
            { theme: 'Yiqilish (Falling)', percentage: 11 },
            { theme: 'Notanish (Stranger)', percentage: 8 },
            { theme: 'Tishlar (Teeth)', percentage: 6 },
            { theme: 'Olov (Fire)', percentage: 5 },
            { theme: 'Poyezd (Train)', percentage: 4 },
        ],
        analysis: translations.publicDreamsAnalysisText
    };

    const [currentStats, setCurrentStats] = useState<CountryDreamStats>(defaultStats);
    const [positions, setPositions] = useState<{top: string, left: string, delay: string, color: string, size: number}[]>([]);

    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-gray-500', 'bg-yellow-500', 'bg-orange-500', 'bg-indigo-500'];

    // Generate random positions for bubbles
    const generatePositions = (count: number) => {
        return Array.from({ length: count }).map((_, i) => ({
            top: `${Math.random() * 60 + 10}%`,
            left: `${Math.random() * 60 + 10}%`,
            delay: `${Math.random() * 5}s`,
            color: colors[i % colors.length],
            size: Math.max(60, 120 - (i * 8)) // Decrease size for lower ranked items
        }));
    };

    // Update positions when stats change
    useEffect(() => {
        setPositions(generatePositions(currentStats.trends.length));
    }, [currentStats]);

    // Update default stats when translations change (Language Switch)
    useEffect(() => {
        if (!stats) { // Only update if we are still showing the default view
            setCurrentStats({
                country: translations.global || 'Global',
                trends: [
                    { theme: 'Suv (Water)', percentage: 28 },
                    { theme: 'Ilon (Snake)', percentage: 21 },
                    { theme: 'Uchish (Flying)', percentage: 14 },
                    { theme: 'Yiqilish (Falling)', percentage: 11 },
                    { theme: 'Notanish (Stranger)', percentage: 8 },
                    { theme: 'Tishlar (Teeth)', percentage: 6 },
                    { theme: 'Olov (Fire)', percentage: 5 },
                    { theme: 'Poyezd (Train)', percentage: 4 },
                ],
                analysis: translations.publicDreamsAnalysisText
            });
        }
    }, [translations, stats]);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!country.trim() || !language) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await getCountryDreamStats(country, language);
            setStats(result);
            setCurrentStats(result);
        } catch (err) {
            console.error(err);
            setError(translations.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto h-full flex flex-col">
            <div className="text-center mb-6 z-10">
                <div className="w-16 h-16 mx-auto text-cyan-300 mb-2 drop-shadow-lg">
                    <PublicDreamsIcon />
                </div>
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">{translations.publicDreamsTitle}</h2>
                <p className="text-gray-400">{translations.publicDreamsSubtitle}</p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-lg mx-auto w-full mb-8 z-20">
                <input 
                    type="text" 
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder={translations.enterCountry || "Enter country name..."}
                    className="w-full py-3 px-6 pr-12 bg-gray-800/60 backdrop-blur-md border border-white/20 rounded-full text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all shadow-lg"
                    disabled={isLoading}
                />
                <button 
                    type="submit" 
                    disabled={isLoading || !country.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full text-white hover:shadow-cyan-500/50 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <div className="w-5 h-5"><SendIcon /></div>}
                </button>
            </form>

            {error && <p className="text-center text-red-400 mb-4 bg-red-900/20 py-2 rounded-lg">{error}</p>}

            {/* Visualizer */}
            <div className="flex-grow relative min-h-[400px] bg-gray-900/40 rounded-3xl border border-white/10 backdrop-blur-xl overflow-hidden shadow-inner shadow-black/60 mb-8 transition-all duration-500">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
                
                {/* Title Overlay */}
                <div className="absolute top-4 left-6 z-10">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">{translations.trendsIn || "Trends in:"}</span>
                    <h3 className="text-2xl font-black text-white">{currentStats.country}</h3>
                </div>

                {positions.length > 0 && currentStats.trends.map((stat, index) => (
                    <div
                        key={stat.theme + index} // Force re-render on new data
                        className={`absolute rounded-full flex flex-col items-center justify-center text-center cursor-default transition-transform hover:scale-110 hover:z-20 shadow-2xl backdrop-blur-md border border-white/20 group animate-float-slow`}
                        style={{
                            width: `${positions[index]?.size || 80}px`,
                            height: `${positions[index]?.size || 80}px`,
                            top: positions[index]?.top,
                            left: positions[index]?.left,
                            backgroundColor: (positions[index]?.color || 'bg-blue-500').replace('bg-', 'rgba(') + ', 0.3)', // Hacky opacity
                            animationDelay: positions[index]?.delay,
                            boxShadow: `0 0 20px ${(positions[index]?.color || 'bg-blue-500').replace('bg-', '')}`
                        }}
                    >
                        <div className={`absolute inset-0 rounded-full ${positions[index]?.color || 'bg-blue-500'} opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                        <span className="font-bold text-white text-xs sm:text-sm relative z-10 drop-shadow-md px-1 leading-tight">{stat.theme}</span>
                        <span className="font-bold text-white text-lg relative z-10">{stat.percentage}%</span>
                    </div>
                ))}
            </div>

            {/* Stats & Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                <div className="bg-gray-800/60 p-6 rounded-2xl border border-cyan-400/20 backdrop-blur-md">
                    <h3 className="text-xl font-bold text-cyan-200 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🔥</span>
                        {translations.trendingDreams}
                    </h3>
                    <ul className="space-y-3">
                        {currentStats.trends.slice(0, 5).map((stat, index) => (
                            <li key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5 hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className={`text-lg font-black ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-500'}`}>#{index + 1}</span>
                                    <span className="text-gray-200 font-medium">{stat.theme}</span>
                                </div>
                                <span className="text-cyan-400 font-bold">{stat.percentage}%</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-gray-800/60 p-6 rounded-2xl border border-cyan-400/20 backdrop-blur-md flex flex-col justify-center">
                    <h3 className="text-xl font-bold text-cyan-200 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-cyan-400 rounded-full"></span>
                        {translations.publicDreamsAnalysisTitle}
                    </h3>
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex-grow">
                        <p className="text-gray-200 leading-relaxed text-lg font-serif italic">
                            "{currentStats.analysis}"
                        </p>
                    </div>
                </div>
             </div>
             
             <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0) translateX(0); }
                    25% { transform: translateY(-15px) translateX(10px); }
                    50% { transform: translateY(0) translateX(20px); }
                    75% { transform: translateY(15px) translateX(10px); }
                }
                .animate-float-slow {
                    animation: float-slow 10s ease-in-out infinite;
                }
             `}</style>
        </div>
    );
};

export default PublicDreams;