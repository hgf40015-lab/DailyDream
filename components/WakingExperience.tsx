
import React, { useState, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { WakingExperienceIcon } from './icons/Icons';

interface WakingExperienceProps {
  onComplete: () => void;
}

const WakingExperience: React.FC<WakingExperienceProps> = ({ onComplete }) => {
    const { translations } = useContext(LanguageContext);
    const [step, setStep] = useState(0);
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);

    const handleMoodSelect = (mood: string) => {
        setSelectedMood(mood);
        setTimeout(() => setStep(2), 400); // Auto advance
    };

    const handleColorSelect = (color: string) => {
        setSelectedColor(color);
        // Don't auto advance, let them confirm with the button to see the selection
    };

    const handleNext = () => {
        onComplete();
    };
    
    const renderStep = () => {
        switch(step) {
            case 0: // Intro
                return (
                    <div className="animate-fade-in flex flex-col items-center">
                        <div className="relative w-32 h-32 mb-8">
                            <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-2xl animate-pulse"></div>
                            <div className="relative w-full h-full text-yellow-200 drop-shadow-[0_0_15px_rgba(253,224,71,0.5)]">
                                <WakingExperienceIcon />
                            </div>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-8 leading-tight tracking-tight drop-shadow-md">
                            {translations.wakingIntro}
                        </h2>
                        <button 
                            onClick={() => setStep(1)} 
                            className="group relative px-10 py-4 bg-white text-gray-900 rounded-full text-xl font-bold hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-300 transform hover:scale-105 active:scale-95"
                        >
                           <span className="relative z-10">{translations.yes || 'Yes, I do'}</span>
                           <div className="absolute inset-0 rounded-full ring-2 ring-white/50 group-hover:ring-white/80 animate-ping opacity-30"></div>
                        </button>
                    </div>
                );
            case 1: // Mood
                return (
                    <div className="animate-fade-in-up text-center w-full max-w-2xl">
                        <h2 className="text-2xl md:text-3xl font-bold text-cyan-100 mb-10">{translations.wakingQuestion1}</h2>
                        <div className="grid grid-cols-3 gap-4 md:gap-8">
                             {[
                                 { id: 'positive', label: translations.positive, emoji: '🤩', color: 'hover:bg-green-500/20 hover:border-green-400' },
                                 { id: 'neutral', label: translations.neutral, emoji: '😐', color: 'hover:bg-gray-500/20 hover:border-gray-400' },
                                 { id: 'negative', label: translations.negative, emoji: '😰', color: 'hover:bg-red-500/20 hover:border-red-400' }
                             ].map((item) => (
                                 <button 
                                    key={item.id}
                                    onClick={() => handleMoodSelect(item.id)}
                                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-white/10 bg-gray-800/40 backdrop-blur-sm transition-all duration-300 group ${item.color} ${selectedMood === item.id ? 'border-cyan-400 bg-cyan-900/30 scale-105' : 'hover:scale-105'}`}
                                 >
                                     <span className="text-5xl md:text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{item.emoji}</span>
                                     <span className="font-bold text-gray-300 group-hover:text-white">{item.label}</span>
                                 </button>
                             ))}
                        </div>
                    </div>
                );
            case 2: // Colors
                return (
                     <div className="animate-fade-in-up text-center w-full max-w-2xl">
                        <h2 className="text-2xl md:text-3xl font-bold text-purple-100 mb-10">{translations.wakingQuestion2}</h2>
                         <div className="flex flex-wrap justify-center gap-6 mb-10">
                             {[
                                 { color: 'bg-red-500', shadow: 'shadow-red-500/50' },
                                 { color: 'bg-orange-500', shadow: 'shadow-orange-500/50' },
                                 { color: 'bg-yellow-400', shadow: 'shadow-yellow-400/50' },
                                 { color: 'bg-green-500', shadow: 'shadow-green-500/50' },
                                 { color: 'bg-blue-500', shadow: 'shadow-blue-500/50' },
                                 { color: 'bg-purple-500', shadow: 'shadow-purple-500/50' },
                                 { color: 'bg-pink-500', shadow: 'shadow-pink-500/50' },
                                 { color: 'bg-white', shadow: 'shadow-white/50' },
                                 { color: 'bg-gray-800', shadow: 'shadow-gray-800/50' }, // Black/Dark
                             ].map((item, idx) => (
                                 <button 
                                    key={idx} 
                                    onClick={() => handleColorSelect(item.color)}
                                    className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${item.color} transition-all duration-300 transform 
                                        ${selectedColor === item.color 
                                            ? `scale-125 ring-4 ring-white ring-offset-4 ring-offset-gray-900 ${item.shadow} shadow-lg` 
                                            : 'hover:scale-110 hover:shadow-lg opacity-80 hover:opacity-100'}`}
                                 />
                             ))}
                        </div>
                        <button
                            onClick={handleNext}
                            disabled={!selectedColor}
                            className="px-10 py-4 text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {translations.wakingAction} ➔
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] h-full text-center p-4">
            {step > 0 && (
                <div className="w-full max-w-xs h-1 bg-gray-800 rounded-full mb-8 overflow-hidden">
                    <div 
                        className="h-full bg-cyan-400 transition-all duration-500 ease-out" 
                        style={{ width: `${(step / 2) * 100}%` }}
                    ></div>
                </div>
            )}
            
            {renderStep()}
        </div>
    );
};

export default WakingExperience;
