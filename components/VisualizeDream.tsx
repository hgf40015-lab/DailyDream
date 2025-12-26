
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

const VisualizeDream: React.FC = () => {
    const { translations, language } = useContext(LanguageContext);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [limitStatus, setLimitStatus] = useState(checkLimit('image'));
    const [hasApiKey, setHasApiKey] = useState(isApiKeyValid());

    useEffect(() => {
        // Re-check API key validity on mount
        setHasApiKey(isApiKeyValid());
    }, []);

    const handleGenerate = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!prompt.trim() || isLoading) return;

        if (!isApiKeyValid()) {
            setError("Xatolik: API kalit o'rnatilmagan! Iltimos, Vercel sozlamalarida API_KEY o'zgaruvchisini qo'shing.");
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
            const finalPrompt = `Cinematic, hyper-realistic, mystical dream-like art: ${englishPrompt}. Deep ethereal lighting, masterpiece, 8k.`;
            
            const base64Image = await generateImageFromDream(finalPrompt);
            setImageUrl(`data:image/png;base64,${base64Image}`);
            
            incrementUsage('image');
            setLimitStatus(checkLimit('image'));
        } catch (e: any) {
            console.error("Generation Error:", e);
            if (e.message === "API_KEY_NOT_CONFIGURED") {
                setError("API kalit topilmadi. Sozlamalarni tekshiring.");
            } else {
                setError(translations.error);
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
                <p className="text-gray-400 mb-6">{translations.visualizeDreamSubtitle}</p>
                
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

            {/* API Warning */}
            {!hasApiKey && (
                <div className="mb-8 p-6 bg-red-900/40 border-2 border-red-500/50 rounded-3xl backdrop-blur-xl flex flex-col items-center text-center animate-bounce-subtle">
                    <div className="w-12 h-12 text-red-400 mb-3"><ShieldIcon /></div>
                    <h3 className="text-xl font-bold text-white mb-2">API Kalit Topilmadi!</h3>
                    <p className="text-red-200 text-sm max-w-md">
                        Sun'iy intellekt ishlashi uchun API_KEY kerak. Iltimos, loyihangizni Vercel orqali sozlab, Environment Variables-ga API kalitini qo'shing.
                    </p>
                </div>
            )}

            {/* Main Display Area */}
            <div className="relative group min-h-[300px] md:min-h-[450px]">
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
                        <div className="text-center p-12 opacity-40 transition-opacity">
                            <div className="w-24 h-24 mx-auto text-gray-500 mb-4"><VisualizeDreamIcon /></div>
                            <p className="text-gray-400 font-medium text-lg">{translations.visualizeDreamPlaceholder}</p>
                        </div>
                    )}

                    {!limitStatus.canUse && !isLoading && !imageUrl && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-8 text-center">
                            <div className="bg-gray-800 p-8 rounded-3xl border border-red-500/30 shadow-2xl">
                                <h3 className="text-2xl font-bold text-white mb-2">{translations.limitReached}</h3>
                                <p className="text-gray-400 text-sm">{translations.limitMessage}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && <div className="mt-6 p-4 bg-red-900/30 border border-red-500/30 rounded-2xl text-red-400 text-center font-bold animate-shake">{error}</div>}

            {/* Input Form */}
            <form onSubmit={handleGenerate} className="mt-10 space-y-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={translations.visualizeDreamPlaceholder}
                    disabled={isLoading || !limitStatus.canUse || !hasApiKey}
                    className={`w-full h-36 p-6 bg-gray-800/40 backdrop-blur-xl border-2 rounded-[2rem] outline-none transition-all duration-300 text-lg text-white placeholder-gray-500 resize-none ${
                        limitStatus.canUse && hasApiKey 
                        ? 'border-white/10 focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/10 shadow-lg' 
                        : 'border-red-500/10 opacity-50'
                    }`}
                />
                <button
                    type="submit"
                    disabled={isLoading || !prompt.trim() || !limitStatus.canUse || !hasApiKey}
                    className={`w-full py-5 rounded-2xl text-xl font-black shadow-2xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-3 ${
                        limitStatus.canUse && hasApiKey 
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
                            {translations.generate}
                        </>
                    )}
                </button>
            </form>
            
            <style>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }
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
