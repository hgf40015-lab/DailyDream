
import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { ChallengesIcon, ShieldIcon, PointsIcon } from './icons/Icons';

const Challenges: React.FC = () => {
    const { translations } = useContext(LanguageContext);
    const [streakCount, setStreakCount] = useState(0);
    const [todayCompleted, setTodayCompleted] = useState(false);
    const [points, setPoints] = useState(0);

    useEffect(() => {
        const streakDataRaw = localStorage.getItem('dream-streak');
        if (streakDataRaw) {
            const streakData = JSON.parse(streakDataRaw);
            const today = new Date().setHours(0, 0, 0, 0);
            const lastDate = streakData.lastDate ? new Date(streakData.lastDate).setHours(0, 0, 0, 0) : null;
            
            if (lastDate === today) {
                setTodayCompleted(true);
            }
            setStreakCount(streakData.count);
        }
        const savedPoints = parseInt(localStorage.getItem('dream-points') || '0', 10);
        setPoints(savedPoints);
    }, []);

    const badges = [
        { id: 1, name: translations.badgeNovice, points: 50, icon: '🌱', color: 'from-green-400 to-green-600' },
        { id: 2, name: translations.badgeExpert, points: 200, icon: '🔮', color: 'from-purple-400 to-purple-600' },
        { id: 3, name: translations.badgeOracle, points: 500, icon: '👁️', color: 'from-amber-400 to-amber-600' },
        { id: 4, name: translations.badgeSocial, points: 1000, icon: '🤝', color: 'from-blue-400 to-blue-600' },
    ];

    // Simulate weekly progress (last 7 days)
    const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const fakeHistory = [true, true, false, true, true, false, todayCompleted]; // Just for visual

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-yellow-500/20 rounded-full blur-[80px] -z-10"></div>
                <div className="w-20 h-20 text-yellow-300 mx-auto mb-2 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                    <ChallengesIcon />
                </div>
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-200 to-yellow-200">{translations.challengesTitle}</h2>
                <p className="text-yellow-100/80 text-lg">{translations.challengesSubtitle}</p>
            </div>

            {/* Main Stats Card */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl p-8 rounded-3xl border border-yellow-500/20 mb-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <h3 className="text-gray-400 text-sm uppercase tracking-widest mb-1">{translations.dreamPoints}</h3>
                        <div className="flex items-center justify-center md:justify-start gap-2">
                            <span className="text-5xl font-black text-white drop-shadow-md">{points}</span>
                            <div className="w-8 h-8 text-yellow-400 animate-bounce"><PointsIcon /></div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="flex gap-2 mb-2">
                            {weekDays.map((day, i) => (
                                <div key={i} className="flex flex-col items-center gap-1">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 ${fakeHistory[i] ? 'bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-lg scale-110' : 'bg-gray-700/50 text-gray-500'}`}>
                                        {fakeHistory[i] ? '✓' : ''}
                                    </div>
                                    <span className="text-[10px] text-gray-500">{day}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm font-bold text-green-400">{streakCount} {translations.sevenDayStreak.split(' ')[2]} 🔥</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Daily Challenge */}
                <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl border border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-300 group">
                     <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-cyan-200 group-hover:text-cyan-100 transition-colors">{translations.dailyChallenge}</h3>
                        <span className="bg-cyan-500/20 text-cyan-300 text-xs px-2 py-1 rounded border border-cyan-500/30">+50 XP</span>
                     </div>
                     <p className="text-gray-300 mb-4">{translations.challengeDesc}</p>
                     <button className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold opacity-90 hover:opacity-100 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all">
                         {todayCompleted ? 'Completed ✅' : 'Start Now'}
                     </button>
                </div>

                {/* Badges */}
                <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl border border-purple-500/30">
                    <h3 className="text-xl font-bold text-purple-200 mb-4">{translations.badges}</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {badges.map((badge) => {
                            const isUnlocked = points >= badge.points;
                            return (
                                <div key={badge.id} className="flex flex-col items-center group cursor-pointer">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-1 transition-all duration-300 border-2 ${isUnlocked ? `bg-gradient-to-br ${badge.color} border-white/20 shadow-lg scale-100` : 'bg-gray-700 border-gray-600 grayscale opacity-50 scale-90'}`}>
                                        {badge.icon}
                                    </div>
                                    <span className={`text-[10px] text-center font-bold leading-tight ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>{badge.name}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Challenges;
