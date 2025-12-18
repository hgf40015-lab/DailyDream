import React, { useState, useContext, useEffect, useRef } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { generateVideoFromDream } from '../services/geminiService';
import { VideoIcon } from './icons/Icons';

const loadingMessages = (translations: any) => [
    translations.generatingVideoMsg1,
    translations.generatingVideoMsg2,
    translations.generatingVideoMsg3,
    translations.generatingVideoMsg4,
    translations.generatingVideoMsg5,
];

const LoadingIndicator: React.FC = () => {
    const { translations } = useContext(LanguageContext);
    const [messageIndex, setMessageIndex] = useState(0);
    const messages = loadingMessages(translations);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [messages.length]);
    
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 bg-purple-500 rounded-full opacity-50 animate-ping"></div>
                <div className="relative w-full h-full bg-cyan-500/30 rounded-full flex items-center justify-center text-cyan-200">
                    <span className="w-12 h-12"><VideoIcon /></span>
                </div>
            </div>
            <p className="mt-4 text-lg animate-pulse">{translations.generatingVideo}</p>
            <p className="mt-2 text-sm text-gray-500 transition-opacity duration-1000">{messages[messageIndex]}</p>
        </div>
    );
};


const DreamVideoGenerator: React.FC = () => {
    const { translations } = useContext(LanguageContext);
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState(false);
    
    useEffect(() => {
        const checkApiKey = async () => {
             if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setApiKeySelected(hasKey);
            }
        };
        checkApiKey();
        
        // Cleanup object URL on unmount
        return () => {
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
        };
    }, []);

    useEffect(() => {
        return () => {
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
        }
    }, [videoUrl]);

    const handleSelectKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            // Optimistically assume the user selected a key. The API call will fail if they didn't.
            setApiKeySelected(true);
        }
    };
    
    const handleGenerate = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        setError(null);
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);

        try {
            const videoBlob = await generateVideoFromDream(prompt, aspectRatio, resolution);
            const url = URL.createObjectURL(videoBlob);
            setVideoUrl(url);
        } catch (e: any) {
            console.error(e);
            if (e.message && e.message.includes("Requested entity was not found.")) {
                setError(translations.apiKeyError);
                setApiKeySelected(false); // Force re-selection
            } else {
                 setError(translations.error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!videoUrl) return;
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = `dream-video-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGenerateNew = () => {
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
        setPrompt('');
        setError(null);
    };

    if (!apiKeySelected) {
        return (
             <div className="max-w-2xl mx-auto text-center flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 mx-auto text-cyan-300 mb-4"><VideoIcon /></div>
                <h2 className="text-3xl font-bold text-glow mb-2">{translations.dreamVideoTitle}</h2>
                <p className="text-gray-300 mb-4">{translations.dreamVideoSubtitle}</p>
                <p className="text-sm text-gray-400 mb-6">{translations.apiKeyNotice} <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">{translations.billingInfo}</a></p>
                <button onClick={handleSelectKey} className="px-8 py-3 text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105 transition-all">
                    {translations.selectApiKey}
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 mx-auto text-cyan-300 mb-4">
                <VideoIcon />
            </div>
            <h2 className="text-3xl font-bold text-glow mb-2">{translations.dreamVideoTitle}</h2>
            <p className="text-gray-300 mb-8">{translations.dreamVideoSubtitle}</p>

            <div className="w-full aspect-video bg-gray-900/50 rounded-2xl border-2 border-purple-400/20 flex items-center justify-center overflow-hidden transition-all duration-500">
                {isLoading && <LoadingIndicator />}
                {error && !isLoading && <p className="text-center text-red-400 px-4">{error}</p>}
                {videoUrl && !isLoading && (
                    <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain animate-fade-in" />
                )}
            </div>
            
            <div className="mt-6">
                {videoUrl && !isLoading ? (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
                        <button
                            onClick={handleDownload}
                            className="px-8 py-3 text-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-lg hover:shadow-emerald-500/50 transform hover:scale-105 transition-all duration-300"
                        >
                            {translations.download}
                        </button>
                        <button
                             onClick={handleGenerateNew}
                            className="px-8 py-3 text-xl font-bold text-white bg-gradient-to-r from-gray-600 to-gray-700 rounded-full shadow-lg hover:shadow-gray-500/50 transform hover:scale-105 transition-all duration-300"
                        >
                           {translations.generateNew}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleGenerate} className="flex flex-col gap-4">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={translations.visualizeDreamPlaceholder}
                            className="w-full h-28 p-4 bg-gray-800/60 border-2 border-purple-400/40 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all duration-300 resize-none text-lg text-white placeholder-gray-400"
                            disabled={isLoading}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-white">
                           <div className="bg-gray-800/60 p-3 rounded-lg border border-purple-400/40">
                               <label className="font-bold mb-2 block">{translations.aspectRatio}</label>
                               <div className="flex justify-center gap-4">
                                   <label className="flex items-center gap-2 cursor-pointer">
                                       <input type="radio" name="aspectRatio" value="16:9" checked={aspectRatio === '16:9'} onChange={() => setAspectRatio('16:9')} className="form-radio bg-gray-700 text-cyan-500" disabled={isLoading} />
                                       16:9
                                   </label>
                                   <label className="flex items-center gap-2 cursor-pointer">
                                       <input type="radio" name="aspectRatio" value="9:16" checked={aspectRatio === '9:16'} onChange={() => setAspectRatio('9:16')} className="form-radio bg-gray-700 text-cyan-500" disabled={isLoading}/>
                                       9:16
                                   </label>
                               </div>
                           </div>
                           <div className="bg-gray-800/60 p-3 rounded-lg border border-purple-400/40">
                               <label className="font-bold mb-2 block">{translations.resolution}</label>
                               <div className="flex justify-center gap-4">
                                   <label className="flex items-center gap-2 cursor-pointer">
                                       <input type="radio" name="resolution" value="720p" checked={resolution === '720p'} onChange={() => setResolution('720p')} className="form-radio bg-gray-700 text-cyan-500" disabled={isLoading}/>
                                       720p
                                   </label>
                                   <label className="flex items-center gap-2 cursor-pointer">
                                       <input type="radio" name="resolution" value="1080p" checked={resolution === '1080p'} onChange={() => setResolution('1080p')} className="form-radio bg-gray-700 text-cyan-500" disabled={isLoading}/>
                                       1080p
                                   </label>
                               </div>
                           </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !prompt.trim()}
                            className="px-8 py-3 text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                        >
                            {isLoading ? translations.generatingVideo : translations.generate}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default DreamVideoGenerator;