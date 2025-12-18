
import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { getPersonalityTest, getDreamTestChoices } from '../services/geminiService';
import { StoredDream, DreamTestResult } from '../types';
import { DreamTestIcon, FutureIcon, PsychologyIcon, ShieldIcon } from './icons/Icons';

type TestStep = 'initial' | 'loading_choices' | 'choices' | 'loading_result' | 'result';

const DreamTest: React.FC = () => {
    const { translations, language } = useContext(LanguageContext);
    const [dreamCount, setDreamCount] = useState(0);
    const [dreams, setDreams] = useState<StoredDream[]>([]);
    const [testResult, setTestResult] = useState<DreamTestResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [canTakeTest, setCanTakeTest] = useState(false);
    const [testMilestone, setTestMilestone] = useState(0);
    const [step, setStep] = useState<TestStep>('initial');
    const [choices, setChoices] = useState<string[]>([]);
    
    // Sound effects
    const playClickSound = () => {
         const audio = new Audio('https://cdn.pixabay.com/audio/2023/11/19/audio_82e88a3b5a.mp3'); // Soft magical tap
         audio.volume = 0.3;
         audio.play().catch(() => {});
    };

    const playUnlockSound = () => {
        const audio = new Audio('https://cdn.pixabay.com/audio/2022/03/24/audio_c8c8a73467.mp3'); // Magical chime
        audio.volume = 0.4;
        audio.play().catch(() => {});
    };

    useEffect(() => {
        const savedDreamsRaw = localStorage.getItem('user-dreams');
        if (savedDreamsRaw) {
            const allDreams: StoredDream[] = JSON.parse(savedDreamsRaw);
            setDreams(allDreams);
            setDreamCount(allDreams.length);

            // Logic: Test opens every 3 dreams
            const nextMilestone = Math.floor(allDreams.length / 3) * 3;
            
            if (nextMilestone > 0) {
                const savedResult = localStorage.getItem(`dream-test-result-${nextMilestone}`);
                
                if (savedResult) {
                    setTestResult(JSON.parse(savedResult));
                    setStep('result');
                    setCanTakeTest(false);
                } else {
                    setCanTakeTest(true);
                    setTestMilestone(nextMilestone);
                    if (step === 'initial') {
                        // Ensure we are in initial state to show the button
                    }
                }
            }
        }
    }, []);

    useEffect(() => {
        if (canTakeTest && step === 'initial') {
            playUnlockSound();
        }
    }, [canTakeTest]);

    const handleTakeTest = async () => {
        playClickSound();
        if (!canTakeTest || !language) return;

        setStep('loading_choices');
        setError(null);
        
        try {
            // Use the last 3 dreams for context
            const dreamsForTest = dreams.slice(Math.max(0, dreams.length - 3), dreams.length);
            const themeChoices = await getDreamTestChoices(dreamsForTest, language);
            setChoices(themeChoices);
            setStep('choices');
        } catch (e) {
            console.error(e);
            setError(translations.error);
            setStep('initial');
        }
    };

    const handleSelectChoice = async (choice: string) => {
        playClickSound();
        if (!language) return;
        setStep('loading_result');
        setError(null);

        try {
            const dreamsForTest = dreams.slice(Math.max(0, dreams.length - 3), dreams.length);
            const result = await getPersonalityTest(dreamsForTest, language, choice);
            setTestResult(result);
            localStorage.setItem(`dream-test-result-${testMilestone}`, JSON.stringify(result));
            setCanTakeTest(false);
            setStep('result');
        } catch (e) {
             console.error(e);
            setError(translations.error);
            setStep('choices');
        }
    }

    // Logic for slots: 0, 1, 2 filled. If 3, it resets or unlocks.
    const currentCycleCount = dreamCount % 3;
    // If canTakeTest is true, it means we hit 3/3, so show full bars.
    const filledSlots = canTakeTest ? 3 : currentCycleCount;
    const dreamsNeeded = 3 - filledSlots;

    const renderContent = () => {
        switch (step) {
            case 'loading_choices':
            case 'loading_result':
                return (
                     <div className="flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
                        <div className="relative w-28 h-28 mb-8">
                            <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping"></div>
                            <div className="absolute inset-0 border-4 border-t-cyan-400 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-4xl animate-bounce">🔮</span>
                            </div>
                        </div>
                        <p className="text-xl font-medium text-cyan-100 tracking-wider animate-pulse">
                          {step === 'loading_choices' ? translations.consultingOracle : translations.interpretingChoice}
                        </p>
                    </div>
                );
            case 'choices':
                return (
                    <div className="text-center animate-fade-in min-h-[500px] flex flex-col justify-center">
                        <h3 className="text-2xl md:text-4xl font-bold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-purple-200 drop-shadow-lg">
                            {translations.whichThemeResonates}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
                            {choices.map((choice, index) => (
                                <button 
                                    key={index} 
                                    onClick={() => handleSelectChoice(choice)} 
                                    className="group relative h-40 bg-gray-900/60 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 hover:border-cyan-400/50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] cursor-pointer active:scale-95"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-cyan-900/20 group-hover:opacity-100 opacity-0 transition-opacity duration-500"></div>
                                    <div className="absolute -right-6 -bottom-6 text-8xl opacity-10 group-hover:opacity-20 transition-all duration-500 group-hover:rotate-12">✨</div>
                                    <div className="relative z-10 flex flex-col items-center justify-center h-full p-4">
                                        <span className="text-2xl md:text-3xl font-bold text-white group-hover:text-cyan-200 transition-colors shadow-black drop-shadow-md">
                                            {choice}
                                        </span>
                                        <span className="mt-2 text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Select this path ➔
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'result':
                if (!testResult) return null;
                return (
                    <div className="relative bg-gray-900/80 backdrop-blur-xl border-2 border-yellow-500/30 rounded-[2rem] p-8 md:p-12 shadow-2xl animate-fade-in-up overflow-hidden max-w-3xl mx-auto">
                        {/* Decorative background */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                        <div className="relative z-10 text-center mb-10">
                            <div className="inline-block px-4 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">
                                {translations.yourPersonalityType}
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-100 to-yellow-200 drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                                {testResult.personalityType}
                            </h2>
                        </div>
                        
                        <div className="grid gap-6 relative z-10">
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-300"><PsychologyIcon /></div>
                                    <h4 className="font-bold text-cyan-200 text-lg">{translations.analysis}</h4>
                                </div>
                                <p className="text-gray-200 leading-relaxed text-base md:text-lg">{testResult.analysis}</p>
                            </div>

                            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl p-6 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-300"><FutureIcon /></div>
                                    <h4 className="font-bold text-yellow-200 text-lg">{translations.yourAdvice}</h4>
                                </div>
                                <p className="text-white italic font-serif text-xl leading-relaxed">"{testResult.advice}"</p>
                            </div>
                        </div>
                    </div>
                );
            case 'initial':
            default:
                 return (
                    <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
                        {canTakeTest ? (
                            <div className="animate-fade-in-up w-full max-w-lg">
                                <div className="relative mb-8 group cursor-pointer" onClick={handleTakeTest}>
                                    <div className="absolute inset-0 bg-cyan-500 blur-[60px] opacity-40 animate-pulse rounded-full"></div>
                                    <div className="relative w-32 h-32 mx-auto text-cyan-200 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] transform group-hover:scale-110 transition-transform duration-500">
                                        <DreamTestIcon />
                                    </div>
                                </div>
                                
                                <h3 className="text-4xl font-bold text-white mb-6">The Oracle is Ready</h3>
                                
                                <button
                                    onClick={handleTakeTest}
                                    className="px-12 py-5 text-xl font-bold text-gray-900 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-[length:200%_auto] animate-gradient-x rounded-full shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] hover:scale-105 active:scale-95 transition-all duration-300"
                                >
                                    {translations.takeTheTest}
                                </button>
                                <p className="mt-4 text-cyan-300/70 text-sm">Tap to reveal your hidden archetype</p>
                            </div>
                        ) : (
                            <div className="w-full max-w-md bg-gray-900/60 p-10 rounded-[2rem] border border-white/10 backdrop-blur-xl shadow-2xl">
                                <div className="mb-8 opacity-50 grayscale">
                                    <div className="w-20 h-20 mx-auto"><ShieldIcon /></div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-200 mb-6">
                                    {/* Hardcoded fallback if translation is old */}
                                    {translations.dreamTestSubtitle && translations.dreamTestSubtitle.includes('10') 
                                        ? "Har 3 ta tushdan so'ng yangi qirralaringizni kashf eting" 
                                        : translations.dreamTestSubtitle}
                                </h3>
                                
                                {/* 3 Slot Progress Indicator */}
                                <div className="flex justify-center gap-4 mb-8">
                                    {[1, 2, 3].map((slot) => {
                                        const isFilled = slot <= filledSlots;
                                        return (
                                            <div key={slot} className="relative w-12 h-16 rounded-xl border-2 border-gray-700 bg-gray-800 overflow-hidden shadow-inner">
                                                <div className={`absolute inset-0 bg-gradient-to-b from-cyan-400 to-blue-600 transition-all duration-1000 ease-out ${isFilled ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-30'}`}></div>
                                                <div className={`absolute inset-0 flex items-center justify-center font-bold text-lg ${isFilled ? 'text-white' : 'text-gray-600'}`}>
                                                    {isFilled ? '✓' : slot}
                                                </div>
                                                {isFilled && <div className="absolute inset-0 bg-white/30 animate-pulse"></div>}
                                            </div>
                                        )
                                    })}
                                </div>
                                
                                <p className="text-cyan-400 font-mono text-sm mb-2 uppercase tracking-widest">
                                    {filledSlots} / 3 Dreams Collected
                                </p>

                                <p className="text-gray-400 text-sm">
                                    {dreamsNeeded === 0 
                                        ? "Ready to unlock!" 
                                        : `Record ${dreamsNeeded} more dream${dreamsNeeded > 1 ? 's' : ''} to unlock.`}
                                </p>
                            </div>
                        )}
                        {error && <p className="mt-6 text-red-400 bg-red-900/30 px-4 py-2 rounded-lg">{error}</p>}
                    </div>
                 );
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-6">
            {step === 'initial' && (
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-200 to-purple-300 mb-2">{translations.dreamTestTitle}</h2>
                    <p className="text-gray-400 text-lg">
                         {translations.dreamTestSubtitle && translations.dreamTestSubtitle.includes('10') 
                            ? "Har 3 ta tushdan so'ng..." 
                            : translations.dreamTestSubtitle}
                    </p>
                </div>
            )}
            
            {renderContent()}
        </div>
    );
};

export default DreamTest;
