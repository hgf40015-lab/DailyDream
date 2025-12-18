
import React, { useState, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { generateImageFromDream, SafetyError } from '../services/geminiService';
import { saveImageToDB } from '../services/imageStorage';
import { VisualizeDreamIcon, GalleryIcon } from './icons/Icons';
import { DreamImage } from '../types';
import DreamGallery from './DreamGallery';

const ImageLoadingIndicator = () => {
    const { translations } = useContext(LanguageContext);
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <div className="relative w-32 h-32">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full opacity-70 animate-ping blur-xl"></div>
                <div className="relative w-full h-full bg-gray-900 rounded-full flex items-center justify-center border-4 border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                    <span className="w-12 h-12 text-cyan-300 animate-pulse"><VisualizeDreamIcon /></span>
                </div>
            </div>
            <p className="mt-6 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-cyan-300 animate-pulse">{translations.generatingImage}</p>
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
        
        // Revised Prompt Engineering:
        const fullPrompt = `Generate a high-quality, detailed image of: ${prompt}. \n\nVisual Style: ${selectedStyle}. \nQuality Tags: Masterpiece, 8k resolution, highly detailed, sharp focus, professional lighting, aesthetic composition, vivid colors.`;

        try {
            const base64Image = await generateImageFromDream(fullPrompt);
            setImageUrl(`data:image/png;base64,${base64Image}`);
        } catch (e) {
            if (e instanceof SafetyError) {
                setError(translations.safetyWarning);
            } else {
                setError(translations.error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!imageUrl) return;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `daily-dream-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSaveToGallery = async () => {
        if (!imageUrl) return;
        
        const newImage: DreamImage = {
            id: Date.now().toString(),
            imageUrl: imageUrl,
            prompt: prompt,
            style: selectedStyle,
            date: new Date().toISOString()
        };

        try {
            await saveImageToDB(newImage);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        } catch (e) {
            console.error("Failed to save image to DB", e);
            setError(translations.error);
        }
    };

    const handleGenerateNew = () => {
        setPrompt('');
        setError(null);
        setImageUrl(null);
        setIsSaved(false);
    };

    return (
        <div className="max-w-6xl mx-auto h-full flex flex-col">
            {/* Header Area with Tabs */}
            <div className="flex flex-col items-center mb-8">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-cyan-200 to-purple-200 animate-gradient-x mb-4">{translations.visualizeDreamTitle}</h2>
                
                {/* Modern Pill Tabs */}
                <div className="inline-flex bg-gray-900/80 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-lg">
                    <button 
                        onClick={() => setActiveTab('create')}
                        className={`relative px-8 py-2 rounded-full text-sm font-bold transition-all duration-500 z-10 ${activeTab === 'create' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        {activeTab === 'create' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full -z-10 shadow-md"></div>
                        )}
                        {translations.tabCreate || "Create"}
                    </button>
                    <button 
                        onClick={() => setActiveTab('gallery')}
                        className={`relative px-8 py-2 rounded-full text-sm font-bold transition-all duration-500 z-10 ${activeTab === 'gallery' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        {activeTab === 'gallery' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full -z-10 shadow-md"></div>
                        )}
                        {translations.tabGallery || "Gallery"}
                    </button>
                </div>
            </div>

            <div className="flex-grow">
                {activeTab === 'gallery' ? (
                    <div className="animate-fade-in">
                        <DreamGallery />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up">
                        {/* Controls Section */}
                        <div className="space-y-6">
                            {!imageUrl && (
                                <div className="bg-gray-800/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl">
                                    <label className="block text-cyan-300 font-bold mb-3 text-sm uppercase tracking-wider">{translations.styleTitle}</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                                        {styles.map((style) => (
                                            <button
                                                key={style.id}
                                                onClick={() => setSelectedStyle(style.id)}
                                                className={`relative overflow-hidden rounded-xl p-3 text-sm font-bold transition-all duration-300 ${selectedStyle === style.id ? 'ring-2 ring-white scale-105 shadow-lg' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                                            >
                                                <div className={`absolute inset-0 bg-gradient-to-br ${style.color} opacity-80`}></div>
                                                <span className="relative z-10 text-white shadow-black drop-shadow-md">{style.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder={translations.visualizeDreamPlaceholder}
                                        className="w-full h-32 p-4 bg-black/30 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition-all resize-none text-white placeholder-gray-500 mb-6"
                                        disabled={isLoading}
                                    />

                                    <button
                                        onClick={handleGenerate}
                                        disabled={isLoading || !prompt.trim()}
                                        className="w-full py-4 text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none relative overflow-hidden group"
                                    >
                                        <span className="relative z-10">{isLoading ? translations.generatingImage : translations.generate}</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </button>
                                </div>
                            )}
                            
                            {imageUrl && (
                                <div className="flex flex-col gap-4 animate-fade-in">
                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleDownload}
                                            className="flex-1 py-3 text-lg font-bold text-gray-900 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl shadow-lg hover:shadow-green-500/50 transform hover:scale-[1.02] transition-all"
                                        >
                                            {translations.download}
                                        </button>
                                        <button
                                            onClick={handleSaveToGallery}
                                            disabled={isSaved}
                                            className={`flex-1 py-3 text-lg font-bold text-white rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 ${isSaved ? 'bg-gray-600 cursor-default' : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-blue-500/50'}`}
                                        >
                                            {isSaved ? (
                                                <span>{translations.savedToGallery} ✓</span>
                                            ) : (
                                                <>
                                                    <div className="w-5 h-5"><GalleryIcon /></div>
                                                    <span>{translations.saveToGallery}</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleGenerateNew}
                                        className="w-full py-3 text-lg font-bold text-white bg-gray-700/50 border border-white/10 rounded-xl hover:bg-gray-700 transition-all"
                                    >
                                        {translations.generateNew}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Display Section */}
                        <div className={`relative w-full aspect-square lg:aspect-auto lg:h-full min-h-[400px] bg-gray-900/60 rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl ${isLoading ? 'animate-pulse border-purple-500/30' : ''}`}>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                            
                            {isLoading && <ImageLoadingIndicator />}
                            
                            {error && !isLoading && (
                                <div className="text-center p-6 bg-red-500/10 border border-red-500/30 rounded-xl max-w-sm">
                                    <p className="text-red-300 font-bold">{error}</p>
                                </div>
                            )}

                            {imageUrl && !isLoading && (
                                <img src={imageUrl} alt={prompt} className="w-full h-full object-cover animate-fade-in" />
                            )}

                            {!isLoading && !imageUrl && !error && (
                                <div className="text-center text-gray-500 px-6">
                                    <div className="w-20 h-20 mx-auto mb-4 opacity-50"><VisualizeDreamIcon /></div>
                                    <p>{translations.visualizeExamples}</p>
                                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                                        <span onClick={() => setPrompt(translations.examplePrompt1)} className="cursor-pointer px-3 py-1 bg-white/5 rounded-full text-xs hover:bg-white/10 transition-colors border border-white/5">✨ {translations.examplePrompt1.substring(0, 30)}...</span>
                                        <span onClick={() => setPrompt(translations.examplePrompt2)} className="cursor-pointer px-3 py-1 bg-white/5 rounded-full text-xs hover:bg-white/10 transition-colors border border-white/5">🦋 {translations.examplePrompt2.substring(0, 30)}...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VisualizeDream;
