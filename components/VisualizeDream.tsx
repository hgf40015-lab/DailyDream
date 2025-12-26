
import React, { useState, useContext, useEffect } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { generateImageFromDream, translateForImage, SafetyError } from '../services/geminiService';
import { checkLimit, incrementUsage } from '../services/limitService';
import { saveImageToDB } from '../services/imageStorage';
import { VisualizeDreamIcon } from './icons/Icons';
import { DreamImage } from '../types';
import DreamGallery from './DreamGallery';

// ... (Indicator qismi o'zgarishsiz)

const VisualizeDream: React.FC = () => {
    const { translations } = useContext(LanguageContext);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [limitStatus, setLimitStatus] = useState(checkLimit('image'));

    const handleGenerate = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!prompt.trim()) return;

        if (!checkLimit('image').canUse) {
            setError("Bugungi rasm yaratish limiti tugadi (3 ta).");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const englishPrompt = await translateForImage(prompt);
            const finalPrompt = `A stunning cinematic art of: ${englishPrompt}`;
            const base64Image = await generateImageFromDream(finalPrompt);
            
            setImageUrl(`data:image/png;base64,${base64Image}`);
            incrementUsage('image');
            setLimitStatus(checkLimit('image'));
        } catch (e: any) {
            setError(e.message || translations.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto h-full flex flex-col px-4">
            <div className="text-center mb-4">
                 <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest bg-pink-900/20 px-3 py-1 rounded-full border border-pink-500/20">
                    Limit: {limitStatus.remaining} / 3
                </span>
            </div>
            
            {/* ... (UI qolgan qismi o'zgarishsiz, faqat tugmani limit bilan bog'laymiz) */}
            <button 
                onClick={handleGenerate} 
                disabled={isLoading || !prompt.trim() || !limitStatus.canUse}
                className="w-full py-4 text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-xl disabled:opacity-30"
            >
                {limitStatus.canUse ? (isLoading ? translations.generatingImage : translations.generate) : "LIMIT TUGADI"}
            </button>
        </div>
    );
};

export default VisualizeDream;
