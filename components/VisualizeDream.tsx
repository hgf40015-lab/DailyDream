
import React, { useState, useContext, useEffect } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { generateImageFromDream, translateForImage, isApiKeyValid } from '../services/geminiService';
import { checkLimit, incrementUsage } from '../services/limitService';
import { VisualizeDreamIcon, TrashIcon, SparklesIcon, ShieldIcon } from './icons/Icons';

const LoadingIndicator: React.FC = () => {
    const { translations } = useContext(LanguageContext);
    return (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 bg-pink-500/30 rounded-full animate-ping"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-12 h-12 text-white animate-pulse">
                        <SparklesIcon />
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                <p className="text-xl font-bold text-white animate-pulse">{translations.generatingImage || "Tushingiz chizilmoqda..."}</p>
                <p className="text-sm text-gray-400 italic">"{translations.artisticProcess || "AI ranglar bilan ishlamoqda..."}"</p>
            </div>
        </div>
    );
};

// Chizish uslublari ro'yxati
const STYLES = [
    { id: 'mystical', label: 'Sirli', emoji: '✨', prompt: 'Mystical, ethereal, dream-like atmosphere' },
    { id: 'cinematic', label: 'Kinematik', emoji: '🎬', prompt: 'Cinematic lighting, hyper-realistic, 8k masterpiece' },
    { id: 'anime', label: 'Anime', emoji: '🌸', prompt: 'High-quality anime style, Studio Ghibli inspired, vibrant colors' },
    { id: 'oil_painting', label: 'Moybo\'yoq', emoji: '🎨', prompt: 'Classical oil painting, thick brushstrokes, textured canvas' },
    { id: 'cyberpunk', label: 'Kiberpank', emoji: '🌃', prompt: 'Cyberpunk aesthetic, neon lights, rainy night, futuristic' },
    { id: 'sketch', label: 'Eskiz', emoji: '✍️', prompt: 'Charcoal sketch, detailed pencil drawing, artistic paper texture' },
    { id: '3d_render', label: '3D Render', emoji: '🧊', prompt: 'Octane render, Unreal Engine 5 style, volumetric lighting' },
];

const VisualizeDream: React.FC = () => {
    const { translations } = useContext(LanguageContext);
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [limitStatus, setLimitStatus] = useState(checkLimit('image'));
    const [hasApiKey, setHasApiKey] = useState(isApiKeyValid());
    const [isShaking, setIsShaking] = useState(false);

    useEffect(() => {
        setHasApiKey(isApiKeyValid());
    }, []);

    const handleGenerate = async (e?: React.FormEvent) => {
        e?.preventDefault();
        
        if (!prompt.trim()) {
            setError("Iltimos, avval tushingizni pastdagi maydonga yozing!");
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            return;
        }

        if (isLoading) return;

        if (!isApiKeyValid()) {
            setError("Xatolik: API_KEY sozlanmagan. Iltimos, Vercel-da API kalitini qo'shing.");
            return;
        }

        const currentLimit = checkLimit('image');
        if (!currentLimit.canUse) {
            setError(translations.limitReached);
            return;
        }

        setIsLoading(true);
        setError(null);
        setImageUrl(null);

        try {
            const englishPrompt = await translateForImage(prompt);
            // Tanlangan uslubni promptga qo'shamiz
            const finalPrompt = `${selectedStyle.prompt}: ${englishPrompt}. Deep details, high resolution, artistic composition.`;
            
            const base64Image = await generateImageFromDream(finalPrompt);
            setImageUrl(`data:image/png;base64,${base64Image}`);
            
            incrementUsage('image');
            setLimitStatus(checkLimit('image'));
        } catch (e: any) {
            console.error("Generation Error:", e);
            if (e.name === "SafetyError") {
                setError("Kechirasiz, tushingizdagi ba'zi so'zlar xavfsizlik filtri tomonidan bloklandi.");
            } else {
                setError("Rasm yaratishda xatolik yuz berdi. API kalit yoki internetingizni tekshiring.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 pb-20 animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto text-pink-400 mb-4 drop-shadow-[0_0_15px_rgba(244,114,182,0.6)]">
                    <VisualizeDreamIcon />
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tighter">{translations.visualizeDream}</h2>
                <p className="text-gray-400 mb-4">{translations.visualizeDreamSubtitle}</p>
                
                <div className="flex flex-col items-center gap-2">
                    <div className={`px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ${
                        limitStatus.remaining > 0 
                        ? 'bg-pink-900/20 border-pink-500/30 text-pink-400' 
                        : 'bg-red-900/30 border-red-500/50 text-red-400'
                    }`}>
                        {translations.imageLimit}: {limitStatus.remaining} / 3
                    </div>
                </div>
            </div>

            {/* Style Selector Section */}
            <div className="mb-8">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 text-center">Chizish uslubini tanlang</p>
                <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                    {STYLES.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => setSelectedStyle(style)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-300 ${
                                selectedStyle.id === style.id
                                ? 'bg-pink-500/20 border-pink-400 text-white shadow-[0_0_15px_rgba(244,114,182,0.3)] scale-105'
                                : 'bg-gray-900/40 border-white/5 text-gray-400 hover:border-white/20'
                            }`}
                        >
                            <span className="text-lg">{style.emoji}</span>
                            <span className="text-sm font-bold">{style.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Canvas */}
            <div className="relative group min-h-[300px] md:min-h-[400px]">
                <div className={`w-full aspect-square md:aspect-video bg-gray-900/60 rounded-[2.5rem] border-2 border-dashed transition-all duration-500 overflow-hidden flex items-center justify-center shadow-2xl relative ${
                    limitStatus.canUse ? 'border-white/10 group-hover:border-pink-500/30' : 'border-red-500/20 bg-black/40'
                }`}>
                    
                    {isLoading ? (
                        <LoadingIndicator />
                    ) : imageUrl ? (
                        <div className="relative w-full h-full animate-fade-in group/img">
                            <img src={imageUrl} alt="Generated" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end justify-center pb-8">
                                <button onClick={() => window.open(imageUrl, '_blank')} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform shadow-xl">
                                    {translations.download}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-12 opacity-30 group-hover:opacity-50 transition-opacity">
                            <div className="w-24 h-24 mx-auto text-gray-500 mb-4 animate-pulse"><VisualizeDreamIcon /></div>
                            <p className="text-gray-400 font-medium text-lg italic">Siz tanlagan {selectedStyle.label} uslubida rasm shu yerda chiqadi...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && <div className="mt-6 p-4 bg-red-900/30 border border-red-500/30 rounded-2xl text-red-400 text-center font-bold animate-shake">{error}</div>}

            {/* Input Form */}
            <form onSubmit={handleGenerate} className="mt-8 space-y-4">
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Tushingizni tasvirlang..."
                        disabled={isLoading || !limitStatus.canUse}
                        className={`w-full h-36 p-6 bg-gray-800/40 backdrop-blur-xl border-2 rounded-[2rem] outline-none transition-all duration-300 text-lg text-white placeholder-gray-500 resize-none ${
                            isShaking ? 'animate-shake border-red-500' : 'border-white/10 focus:border-pink-500/50 shadow-lg'
                        } ${!limitStatus.canUse ? 'opacity-50' : ''}`}
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={isLoading || !limitStatus.canUse}
                    className={`w-full py-5 rounded-2xl text-xl font-black shadow-2xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-3 ${
                        limitStatus.canUse 
                        ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 hover:scale-[1.02] text-white shadow-pink-500/20' 
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed grayscale'
                    }`}
                >
                    {isLoading ? (
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            {translations.interpreting}
                        </div>
                    ) : (
                        <>
                            <div className="w-6 h-6"><SparklesIcon /></div>
                            {translations.generate} ({selectedStyle.label})
                        </>
                    )}
                </button>
            </form>
            
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
            `}</style>
        </div>
    );
};

export default VisualizeDream;
