
import { GoogleGenAI, Type, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { 
    Language, 
    DreamPrediction, 
    DreamMachineResult,
    StoredDream,
    DreamSymbolMeaning,
    CardPredictionResult,
    DreamTestResult,
    DreamAnalysis,
    DreamMapData,
    CountryDreamStats
} from '../types';

export class SafetyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SafetyError";
    }
}

// Offline fallback dictionary remains for extreme cases
export const offlineDictionaries: any = {
    en: {
        positiveWords: ['happy', 'joy', 'love', 'fly', 'beautiful', 'win', 'bright'],
        negativeWords: ['sad', 'fear', 'fall', 'death', 'snake', 'dark', 'loss'],
    },
    uz: {
        positiveWords: ['baxtli', 'shodlik', 'sevgi', 'uchish', 'go\'zal', 'yutuq', 'yorug\''],
        negativeWords: ['xafa', 'qo\'rquv', 'yiqilish', 'o\'lim', 'ilon', 'qorong\'u', 'yo\'qotish'],
    }
};

export const symbolAudioMap: { [key: string]: string } = {
    water: 'https://cdn.pixabay.com/audio/2022/02/04/audio_32b0a9f60f.mp3',
    suv: 'https://cdn.pixabay.com/audio/2022/02/04/audio_32b0a9f60f.mp3',
    rain: 'https://cdn.pixabay.com/audio/2022/08/10/audio_248321045b.mp3',
    yomgʻir: 'https://cdn.pixabay.com/audio/2022/08/10/audio_248321045b.mp3',
    fly: 'https://cdn.pixabay.com/audio/2022/03/24/audio_903960a5d2.mp3',
    uchish: 'https://cdn.pixabay.com/audio/2022/03/24/audio_903960a5d2.mp3',
    fire: 'https://cdn.pixabay.com/audio/2022/02/07/audio_f5592a8b5c.mp3',
    olov: 'https://cdn.pixabay.com/audio/2022/02/07/audio_f5592a8b5c.mp3',
};

// Internal helper to get API Key and log status (without exposing key)
const getApiKey = () => {
    const key = process.env.API_KEY;
    if (!key || key === 'undefined' || key === 'API_KEY' || key.length < 10) {
        return null;
    }
    return key;
};

export const interpretDream = async (dream: string, language: Language): Promise<DreamPrediction> => {
    const apiKey = getApiKey();
    
    if (!apiKey) {
        console.error("Gemini API Key is missing. Please set API_KEY in your environment/Vercel settings.");
        return {
            generalMeaning: language === 'uz' ? "API kaliti sozlanmagan. Iltimos, Vercel sozlamalarini tekshiring." : "API Key is missing in configuration.",
            nextDayAdvice: "Check environment variables.",
            luckPercentage: 0,
            sentiment: 'neutral',
            psychologicalInsight: "Connection unavailable.",
            story: "...",
            offline: true
        };
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze this dream: "${dream}" in ${language}. Provide a mystical and psychological analysis in JSON format.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        generalMeaning: { type: Type.STRING },
                        nextDayAdvice: { type: Type.STRING },
                        luckPercentage: { type: Type.INTEGER },
                        sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'negative'] },
                        psychologicalInsight: { type: Type.STRING },
                        story: { type: Type.STRING },
                    },
                    required: ['generalMeaning', 'nextDayAdvice', 'luckPercentage', 'sentiment', 'psychologicalInsight', 'story'],
                }
            },
        });
        
        const data = JSON.parse(response.text || '{}');
        return { ...data, offline: false };
    } catch (e: any) {
        console.warn("API Error:", e.message);
        return {
            generalMeaning: language === 'uz' ? "Tahlil jarayonida xatolik yuz berdi. Bu limit tugashi yoki internet ulanishi bilan bog'liq bo'lishi mumkin." : "Interpretation failed due to an API error.",
            nextDayAdvice: "Try again in a few moments.",
            luckPercentage: 50,
            sentiment: 'neutral',
            psychologicalInsight: "Error: " + (e.message || "Unknown error"),
            story: "The stars are currently obscured by clouds...",
            offline: true
        };
    }
};

export const getDreamSymbolMeaning = async (symbol: string, language: Language): Promise<DreamSymbolMeaning> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("No API Key");
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Meaning of symbol: "${symbol}" in ${language}. JSON: symbol, islamic, psychological, lifeAdvice.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    symbol: { type: Type.STRING },
                    islamic: { type: Type.STRING },
                    psychological: { type: Type.STRING },
                    lifeAdvice: { type: Type.STRING },
                },
                required: ['symbol', 'islamic', 'psychological', 'lifeAdvice'],
            }
        },
    });
    return JSON.parse(response.text || '{}');
};

export const getGeneralDailyPrediction = async (language: Language): Promise<{ prediction: string }> => {
    const apiKey = getApiKey();
    if (!apiKey) return { prediction: "Bugun sehrli kun." };

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `One-sentence mystical daily fortune for a dreamer in ${language}. Max 12 words.`,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: { type: Type.OBJECT, properties: { prediction: { type: Type.STRING } }, required: ['prediction'] } 
        }
    });
    return JSON.parse(response.text || '{"prediction": "Bugun tushlariz ushaladi."}');
};

export const getCardPrediction = async (cardType: string, language: Language): Promise<CardPredictionResult> => {
    const apiKey = getApiKey();
    if (!apiKey) return { prediction: "Taqdir yo'llari sirli..." };

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Brief mystical prediction for a ${cardType} card in ${language}.`,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: { type: Type.OBJECT, properties: { prediction: { type: Type.STRING } }, required: ['prediction'] } 
        }
    });
    return JSON.parse(response.text || '{"prediction": "..."}');
};

export const getDreamState = async (dreams: StoredDream[], language: Language): Promise<DreamAnalysis> => {
    const apiKey = getApiKey();
    if (!apiKey) return { state: 'warm', reason: "Data unavailable." };

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze dreamer state from these dreams: ${dreams.map(d => d.dream).join(';')}. Language: ${language}`,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: { 
                type: Type.OBJECT, 
                properties: { state: { type: Type.STRING, enum: ['good', 'warning', 'warm', 'dark'] }, reason: { type: Type.STRING } }, 
                required: ['state', 'reason'] 
            } 
        }
    });
    return JSON.parse(response.text || '{"state": "good", "reason": "Stable."}');
};

export const generateDreamFromSymbols = async (symbols: string[], language: Language, settings?: any): Promise<DreamMachineResult> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("No Key");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a dream story from symbols: ${symbols.join(',')}. Language: ${language}. Settings: ${JSON.stringify(settings)}`,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: { 
                type: Type.OBJECT, 
                properties: { title: { type: Type.STRING }, story: { type: Type.STRING }, interpretation: { type: Type.STRING } }, 
                required: ['title', 'story', 'interpretation'] 
            } 
        }
    });
    return JSON.parse(response.text || '{}');
};

export const getDreamTestChoices = async (dreams: StoredDream[], language: Language): Promise<string[]> => {
    const apiKey = getApiKey();
    if (!apiKey) return ['Wisdom', 'Mystery', 'Power', 'Love'];

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `4 abstract themes based on: ${dreams.map(d => d.dream).join(';')}. Language: ${language}`,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: { 
                type: Type.OBJECT, 
                properties: { themes: { type: Type.ARRAY, items: { type: Type.STRING } } }, 
                required: ['themes'] 
            } 
        }
    });
    return JSON.parse(response.text || '{"themes": []}').themes;
};

export const getPersonalityTest = async (dreams: StoredDream[], language: Language, choice: string): Promise<DreamTestResult> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey: apiKey || '' });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Personality test result for choice "${choice}" given these dreams: ${dreams.map(d => d.dream).join(';')}. Language: ${language}`,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: { 
                type: Type.OBJECT, 
                properties: { personalityType: { type: Type.STRING }, analysis: { type: Type.STRING }, advice: { type: Type.STRING } }, 
                required: ['personalityType', 'analysis', 'advice'] 
            } 
        }
    });
    return JSON.parse(response.text || '{}');
};

export const getDreamMapData = async (dream: string, language: Language): Promise<DreamMapData> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey: apiKey || '' });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Dream nodes/links for map: "${dream}". Language: ${language}`,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: { 
                type: Type.OBJECT, 
                properties: { 
                    nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: {type: Type.STRING}, group: {type: Type.STRING}, description: {type: Type.STRING} } } }, 
                    links: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: {type: Type.STRING}, target: {type: Type.STRING}, label: {type: Type.STRING} } } } 
                }, 
                required: ['nodes', 'links'] 
            } 
        }
    });
    return JSON.parse(response.text || '{"nodes": [], "links": []}');
};

export const getDreamCoachInitialMessage = async (dreams: StoredDream[], language: Language): Promise<{ message: string }> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey: apiKey || '' });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Warm greeting as Dream Coach for history: ${dreams.map(d => d.dream).join(';')}. Language: ${language}`,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: { type: Type.OBJECT, properties: { message: {type: Type.STRING} }, required: ['message'] } 
        }
    });
    return JSON.parse(response.text || '{"message": "Welcome!"}');
};

export const generateImageFromDream = async (prompt: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("No API Key");
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { 
            responseModalities: [Modality.IMAGE],
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE }
            ]
        },
    });
    if (response?.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) return part.inlineData.data;
        }
    }
    throw new SafetyError("Blocked");
};

export const getCountryDreamStats = async (country: string, language: Language): Promise<CountryDreamStats> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey: apiKey || '' });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Dream trends for ${country}. Language: ${language}`,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: { 
                type: Type.OBJECT, 
                properties: { 
                    country: { type: Type.STRING }, 
                    trends: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { theme: {type: Type.STRING}, percentage: {type: Type.INTEGER} } } }, 
                    analysis: { type: Type.STRING } 
                }, 
                required: ['country', 'trends', 'analysis'] 
            } 
        }
    });
    return JSON.parse(response.text || '{}');
};

export const generateVideoFromDream = async (prompt: string, aspectRatio: '16:9' | '9:16', resolution: '720p' | '1080p'): Promise<Blob> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("No API Key");
    const ai = new GoogleGenAI({ apiKey });
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: { numberOfVideos: 1, resolution, aspectRatio }
    });
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${apiKey}`);
    return await response.blob();
};
