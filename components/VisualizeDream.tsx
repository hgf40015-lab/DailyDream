
import React, { useState, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { generateImageFromDream, translateForImage, SafetyError } from '../services/geminiService';
import { saveImageToDB } from '../services/imageStorage';
import { VisualizeDreamIcon, GalleryIcon } from './icons/Icons';
import { DreamImage } from '../types';
import DreamGallery from './DreamGallery';

const ImageLoadingIndicator = () => {
    const { translations } = useContext(LanguageContext);
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-6">
            <div className="relative w-24 h-24 md:w-32 md:h-32">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full opacity-70 animate-ping blur-xl"></div>
                <div className="relative w-full h-full bg-gray-900 rounded-full flex items-center justify-center border-4 border-cyan-400/50">
                    <span className="w-10 h-10 md:w-12 md:h-12 text-cyan-300 animate-pulse"><VisualizeDreamIcon /></span>
                </div>
            </div>
            <p className="mt-6 text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-cyan-300 animate-pulse">{translations.generatingImage}</p>
        </div>
    );
};

const VisualizeDream: React.FC = () => {
    const { translations } = useContext(LanguageContext);
    const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState('Cinematic');
    const [isSaved, setIsSaved] = useState(false);

    const styles = [
        { id: 'Cinematic', label: 'Cinematic', color: 'from-blue-500 to-indigo-600' },
        { id: 'Photorealistic', label: 'Realistik', color: 'from-green-400 to-emerald-600' },
        { id: 'Surreal', label: translations.styleSurreal, color: 'from-purple-500 to-indigo-600' },
        { id: 'Cyberpunk', label: translations.styleCyberpunk, color: 'from-pink-500 to-rose-600' },
        { id: 'Watercolor', label: translations.styleWatercolor, color: 'from-blue-400 to-cyan-500' },
        { id: 'Oil Painting', label: translations.styleOilPainting, color: 'from-yellow-500 to-orange-600' },
        { id: 'Anime', label: translations.styleAnime, color: 'from-red-400 to-pink-500' },
        { id: '3D Render', label: translations.style3DRender, color: 'from-gray-400 to-gray-600' },
    ];

    const handleGenerate = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setImageUrl(null);
        setIsSaved(false);

        try {
            // 1. Ingliz tiliga o'girish (Rasm sifati uchun muhim)
            const englishPrompt = await translateForImage(prompt);
            
            // 2. Buyruqni boyitish
            const finalPrompt = `A stunning, high-quality ${selectedStyle} style digital art piece of: ${englishPrompt}. Masterpiece, 8k, detailed composition.`;

            // 3. Rasm yaratish
            const base64Image = await generateImageFromDream(finalPrompt);
            setImageUrl(`data:image/png;base64,${base64Image}`);
        } catch (e: any) {
            console.error("Visualize Error:", e);
            if (e instanceof SafetyError) {
                setError(translations.safetyWarning || "Mazmun bloklandi.");
            } else if (e.message?.includes("API Key") || e.message?.includes("not found")) {
                setError("API Kalit bilan bog'liq muammo. Vercel sozlamalarini tekshiring va 'Redeploy' qiling.");
            } else {
                setError(e.message || translations.error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!imageUrl) return;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `dream-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSaveToGallery = async () => {
        if (!imageUrl) return;
        const newImage: DreamImage = { id: Date.now().toString(), imageUrl, prompt, style: selectedStyle, date: new Date().toISOString() };
        try {
            await saveImageToDB(newImage);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        } catch (e) {
            setError(translations.error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto h-full flex flex-col px-4">
            <div className="flex flex-col items-center mb-8">
                <h2 className="text-3xl font-extrabold text-white text-center mb-6">{translations.visualizeDreamTitle}</h2>
                <div className="inline-flex bg-gray-900/80 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-lg">
                    <button onClick={() => setActiveTab('create')} className={`relative px-8 py-2 rounded-full text-sm font-bold transition-all z-10 ${activeTab === 'create' ? 'text-white' : 'text-gray-400'}`}>
                        {activeTab === 'create' && <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full -z-10"></div>}
                        {translations.tabCreate}
                    </button>
                    <button onClick={() => setActiveTab('gallery')} className={`relative px-8 py-2 rounded-full text-sm font-bold transition-all z-10 ${activeTab === 'gallery' ? 'text-white' : 'text-gray-400'}`}>
                        {activeTab === 'gallery' && <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full -z-10"></div>}
                        {translations.tabGallery}
                    </button>
                </div>
            </div>

            {activeTab === 'gallery' ? (
                <DreamGallery />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                    <div className="space-y-6">
                        {!imageUrl && (
                            <div className="bg-gray-800/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl">
                                <label className="block text-cyan-300 font-bold mb-3 text-sm uppercase tracking-wider">{translations.styleTitle}</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                                    {styles.map((style) => (
                                        <button key={style.id} onClick={() => setSelectedStyle(style.id)} className={`relative overflow-hidden rounded-xl p-3 text-xs font-bold transition-all ${selectedStyle === style.id ? 'ring-2 ring-white scale-105 shadow-xl' : 'opacity-60 hover:opacity-100'}`}>
                                            <div className={`absolute inset-0 bg-gradient-to-br ${style.color} opacity-80`}></div>
                                            <span className="relative z-10 text-white">{style.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={translations.visualizeDreamPlaceholder} className="w-full h-32 p-4 bg-black/30 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-400 outline-none transition-all resize-none text-white placeholder-gray-500 mb-6" disabled={isLoading} />
                                <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="w-full py-4 text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-xl shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 active:scale-95">
                                    {isLoading ? translations.generatingImage : translations.generate}
                                </button>
                            </div>
                        )}
                        {imageUrl && (
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-4">
                                    <button onClick={handleDownload} className="flex-1 py-3 text-lg font-bold text-gray-900 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl hover:shadow-emerald-500/30 transition-all">
                                        {translations.download}
                                    </button>
                                    <button onClick={handleSaveToGallery} disabled={isSaved} className={`flex-1 py-3 text-lg font-bold text-white rounded-xl transition-all ${isSaved ? 'bg-gray-600' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}>
                                        {isSaved ? "Saqlandi ✓" : translations.saveToGallery}
                                    </button>
                                </div>
                                <button onClick={() => { setImageUrl(null); setPrompt(''); }} className="w-full py-3 text-lg font-bold text-white bg-gray-700/50 rounded-xl border border-white/5 hover:bg-gray-700 transition-colors">
                                    {translations.generateNew}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="relative w-full min-h-[400px] bg-gray-900/60 rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl transition-all duration-500">
                        {isLoading && <ImageLoadingIndicator />}
                        {error && !isLoading && (
                            <div className="text-center p-8 bg-red-500/10 border border-red-500/30 rounded-2xl max-w-sm m-4 animate-shake">
                                <p className="text-red-300 font-bold mb-4">{error}</p>
                                <button onClick={handleGenerate} className="text-xs bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-colors text-white font-bold">Qayta urinish</button>
                            </div>
                        )}
                        {imageUrl && !isLoading && <img src={imageUrl} alt="Generated dream" className="w-full h-full object-cover animate-fade-in" />}
                        {!isLoading && !imageUrl && !error && (
                            <div className="text-center text-gray-500 p-8">
                                <div className="w-20 h-20 mx-auto mb-6 opacity-20 animate-pulse"><VisualizeDreamIcon /></div>
                                <p className="text-lg font-medium">Tushingizni tasvirlang va sehrni kutib turing...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisualizeDream;
