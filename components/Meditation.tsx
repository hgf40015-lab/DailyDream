
import React, { useState, useEffect, useContext, useRef } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { MeditationIcon, RainIcon, ForestIcon, OceanIcon, FireIcon, ZenIcon, PlayIcon, PauseIcon, RefreshIcon } from './icons/Icons';

type SoundType = 'rain' | 'forest' | 'ocean' | 'fire' | 'zen' | null;
type MedMode = 'balance' | 'focus' | 'relax' | 'sleep';
type BreathPhase = 'in' | 'hold1' | 'out' | 'hold2';

const soundUrls = {
    rain: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3', // Gentle Rain
    forest: 'https://cdn.pixabay.com/audio/2021/09/06/audio_472bda804a.mp3', // Forest Birds
    ocean: 'https://cdn.pixabay.com/audio/2022/03/15/audio_7313204964.mp3', // Calm Waves
    fire: 'https://cdn.pixabay.com/audio/2022/02/07/audio_f5592a8b5c.mp3', // Crackling Fire
    zen: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3', // Tibetan Bowl
};

const Meditation: React.FC = () => {
    const { translations } = useContext(LanguageContext);
    const [mode, setMode] = useState<MedMode>('balance');
    const [breathPhase, setBreathPhase] = useState<BreathPhase>('in');
    const [selectedSound, setSelectedSound] = useState<SoundType>('rain');
    const [isPlaying, setIsPlaying] = useState(false);
    const [timer, setTimer] = useState(300);
    const [initialTimer, setInitialTimer] = useState(300);
    const [volume, setVolume] = useState(0.5);
    const [completed, setCompleted] = useState(false);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timeoutRef = useRef<number | null>(null);

    // Timings in seconds for each phase per mode
    const modeConfigs = {
        balance: { in: 5, hold1: 0, out: 5, hold2: 0, color: 'text-green-400', glow: 'bg-green-500', name: translations.modeBalance },
        focus: { in: 4, hold1: 4, out: 4, hold2: 4, color: 'text-cyan-400', glow: 'bg-cyan-500', name: translations.modeFocus },
        relax: { in: 4, hold1: 7, out: 8, hold2: 0, color: 'text-indigo-400', glow: 'bg-indigo-500', name: translations.modeRelax },
        sleep: { in: 4, hold1: 0, out: 8, hold2: 0, color: 'text-purple-400', glow: 'bg-purple-500', name: translations.modeSleep },
    };

    const currentConfig = modeConfigs[mode];

    // Audio Sync
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            if (isPlaying && selectedSound) {
                audioRef.current.play().catch(e => console.error("Audio error", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, selectedSound, volume]);

    // Timer Logic
    useEffect(() => {
        let interval: any;
        if (isPlaying && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        setCompleted(true);
                        setIsPlaying(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, timer]);

    // Breathing Animation Logic
    useEffect(() => {
        if (!isPlaying) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setBreathPhase('in'); // Reset position
            return;
        }

        const runPhase = () => {
            let nextPhase: BreathPhase = 'in';
            let duration = 0;

            if (breathPhase === 'in') {
                duration = currentConfig.in;
                nextPhase = currentConfig.hold1 > 0 ? 'hold1' : 'out';
            } else if (breathPhase === 'hold1') {
                duration = currentConfig.hold1;
                nextPhase = 'out';
            } else if (breathPhase === 'out') {
                duration = currentConfig.out;
                nextPhase = currentConfig.hold2 > 0 ? 'hold2' : 'in';
            } else if (breathPhase === 'hold2') {
                duration = currentConfig.hold2;
                nextPhase = 'in';
            }

            timeoutRef.current = window.setTimeout(() => {
                setBreathPhase(nextPhase);
            }, duration * 1000);
        };

        runPhase();

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isPlaying, breathPhase, mode]);

    const handleModeSelect = (newMode: MedMode) => {
        setMode(newMode);
        setIsPlaying(false);
        setBreathPhase('in');
        setCompleted(false);
    };

    const togglePlay = () => {
        if (completed) {
            setCompleted(false);
            setTimer(initialTimer);
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimerChange = (min: number) => {
        const seconds = min * 60;
        setTimer(seconds);
        setInitialTimer(seconds);
        setIsPlaying(false);
        setCompleted(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const getInstructionText = () => {
        switch(breathPhase) {
            case 'in': return translations.breatheIn;
            case 'hold1': 
            case 'hold2': return translations.meditationHold;
            case 'out': return translations.breatheOut;
        }
    };

    // Calculate dynamic scaling for the visualizer
    const getScale = () => {
        if (!isPlaying) return 'scale-100';
        switch(breathPhase) {
            case 'in': return 'scale-125'; // Expand
            case 'hold1': return 'scale-125'; // Stay expanded
            case 'out': return 'scale-90'; // Contract
            case 'hold2': return 'scale-90'; // Stay contracted
        }
    };

    const getDurationClass = () => {
        if (!isPlaying) return 'duration-500';
        switch(breathPhase) {
            case 'in': return `duration-[${currentConfig.in * 1000}ms]`;
            case 'hold1': return `duration-[${currentConfig.hold1 * 1000}ms]`;
            case 'out': return `duration-[${currentConfig.out * 1000}ms]`;
            case 'hold2': return `duration-[${currentConfig.hold2 * 1000}ms]`;
        }
    };

    // Since Tailwind needs static classes for arbitrary values usually, we use style injection for exact timing
    const transitionStyle = isPlaying ? { transitionDuration: `${
        breathPhase === 'in' ? currentConfig.in :
        breathPhase === 'hold1' ? currentConfig.hold1 :
        breathPhase === 'out' ? currentConfig.out : currentConfig.hold2
    }s` } : {};

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto relative overflow-hidden">
            {selectedSound && (
                <audio ref={audioRef} src={soundUrls[selectedSound]} loop />
            )}

            {/* Header */}
            <div className="text-center mb-6 z-10">
                 <div className={`w-12 h-12 mx-auto mb-2 transition-colors duration-500 ${currentConfig.color}`}>
                    <MeditationIcon />
                 </div>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-200 to-white">
                    {translations.meditationTitle}
                </h2>
                <p className="text-gray-400 text-sm">{translations.meditationSubtitle}</p>
            </div>

            {/* Mode Selector */}
            <div className="flex justify-center gap-2 mb-6 z-10 flex-wrap">
                {(Object.keys(modeConfigs) as MedMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => handleModeSelect(m)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 border ${
                            mode === m 
                            ? `bg-white/10 ${modeConfigs[m].color} border-white/20 shadow-lg` 
                            : 'bg-transparent text-gray-500 border-transparent hover:bg-white/5'
                        }`}
                    >
                        {modeConfigs[m].name}
                    </button>
                ))}
            </div>

            {/* Main Visualizer Area */}
            <div className="flex-grow flex flex-col items-center justify-center relative min-h-[400px] bg-gray-900/40 rounded-[3rem] border border-white/5 backdrop-blur-xl shadow-2xl overflow-hidden transition-colors duration-700">
                
                {completed ? (
                    <div className="z-20 text-center animate-fade-in-up">
                        <div className="w-24 h-24 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 border border-green-500/50 shadow-[0_0_30px_rgba(74,222,128,0.3)]">
                            <span className="text-4xl">✨</span>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-2">{translations.meditationCompleted}</h3>
                        <p className="text-gray-400 mb-8">{translations.sessionStats}: <span className="text-white font-mono text-xl ml-2">{Math.floor(initialTimer / 60)} {translations.minutes}</span></p>
                        <button onClick={togglePlay} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2 mx-auto">
                            <div className="w-5 h-5"><RefreshIcon /></div>
                            {translations.tryAgain}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Dynamic Background Gradient */}
                        <div className={`absolute inset-0 opacity-20 transition-opacity duration-1000 ${isPlaying ? 'opacity-40' : 'opacity-10'}`}>
                            <div className={`absolute inset-0 bg-gradient-to-br from-gray-900 via-${currentConfig.glow.replace('bg-', '')}/30 to-gray-900 animate-pulse`}></div>
                        </div>

                        {/* Breathing Circles */}
                        <div className="relative z-10 w-80 h-80 flex items-center justify-center">
                            {/* Outer Guide Ring */}
                            <div 
                                className={`absolute border border-white/10 rounded-full w-full h-full transition-all ease-linear ${
                                    isPlaying ? 'opacity-30 scale-100' : 'opacity-10 scale-90'
                                }`}
                            ></div>
                            
                            {/* The Breathing Orb */}
                            <div 
                                className={`absolute rounded-full blur-[60px] transition-transform ease-in-out ${currentConfig.glow} opacity-40`}
                                style={{ ...transitionStyle, transform: isPlaying ? (getScale() === 'scale-125' ? 'scale(1.4)' : 'scale(0.8)') : 'scale(1)' }}
                            ></div>
                            
                            {/* Center Circle UI */}
                            <div 
                                className={`relative z-20 w-64 h-64 bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all ease-in-out cursor-pointer hover:border-white/30 group ${getScale()}`}
                                style={transitionStyle}
                                onClick={togglePlay}
                            >
                                <div className={`text-2xl sm:text-3xl font-light text-white font-serif tracking-widest animate-fade-in text-center px-4 transition-all duration-300 ${isPlaying ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>
                                    {isPlaying ? getInstructionText() : formatTime(timer)}
                                </div>
                                
                                {isPlaying && <div className="text-xs text-gray-400 mt-3 font-mono tracking-widest">{formatTime(timer)}</div>}
                                
                                {!isPlaying && (
                                    <div className="mt-4 text-white opacity-50 group-hover:opacity-100 transition-opacity">
                                        <div className="w-8 h-8"><PlayIcon /></div>
                                    </div>
                                )}
                                {isPlaying && (
                                    <div className="absolute bottom-10 opacity-0 group-hover:opacity-50 transition-opacity">
                                        <div className="w-6 h-6"><PauseIcon /></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timer Pills */}
                        <div className="relative z-20 flex gap-3 mt-12">
                            {[1, 5, 10, 15].map(min => (
                                <button 
                                    key={min} 
                                    onClick={() => handleTimerChange(min)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-300 ${
                                        initialTimer === min * 60 
                                        ? `bg-white text-gray-900 border-white shadow-lg` 
                                        : 'bg-black/20 border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300'
                                    }`}
                                >
                                    {min} {translations.timerMin}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="mt-6 bg-black/30 backdrop-blur-lg rounded-2xl p-4 border border-white/5 relative z-10 flex flex-col sm:flex-row gap-6 items-center justify-between">
                <div className="flex justify-between items-center w-full sm:w-auto sm:gap-4 overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
                    {[
                        { id: 'rain', label: translations.soundRain, icon: <RainIcon /> },
                        { id: 'forest', label: translations.soundForest, icon: <ForestIcon /> },
                        { id: 'ocean', label: translations.soundOcean, icon: <OceanIcon /> },
                        { id: 'fire', label: translations.soundFire, icon: <FireIcon /> },
                        { id: 'zen', label: translations.soundZen, icon: <ZenIcon /> },
                    ].map((sound) => (
                        <button
                            key={sound.id}
                            onClick={() => setSelectedSound(sound.id as SoundType)}
                            className={`flex flex-col items-center gap-2 min-w-[60px] transition-all duration-300 group ${
                                selectedSound === sound.id 
                                    ? 'opacity-100 transform -translate-y-1' 
                                    : 'opacity-50 hover:opacity-100'
                            }`}
                        >
                            <div className={`w-10 h-10 p-2.5 rounded-full transition-all ${
                                selectedSound === sound.id 
                                ? 'bg-gradient-to-br from-gray-700 to-gray-600 text-white shadow-lg border border-white/20' 
                                : 'bg-transparent text-gray-400 border border-white/5'
                            }`}>
                                {sound.icon}
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider">{sound.label}</span>
                        </button>
                    ))}
                </div>

                {/* Volume Slider */}
                <div className="flex items-center gap-3 w-full sm:w-40 px-2">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{translations.volume}</span>
                    <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={volume} 
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white hover:accent-gray-300"
                    />
                </div>
            </div>
        </div>
    );
};

export default Meditation;
