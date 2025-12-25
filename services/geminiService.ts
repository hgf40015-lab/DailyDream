
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

// Offline fallback for sentiment analysis
export const offlineDictionaries: any = {
    en: {
        positiveWords: ['happy', 'joy', 'love', 'fly', 'beautiful', 'win', 'bright', 'gold'],
        negativeWords: ['sad', 'fear', 'fall', 'death', 'snake', 'dark', 'loss', 'chase'],
    },
    uz: {
        positiveWords: ['baxtli', 'shodlik', 'sevgi', 'uchish', 'go\'zal', 'yutuq', 'yorug\'', 'oltin'],
        negativeWords: ['xafa', 'qo\'rquv', 'yiqilish', 'o\'lim', 'ilon', 'qorong\'u', 'yo\'qotish', 'quvdi'],
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

const getAiInstance = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
        throw new Error("API Key is missing. Please redeploy the app after adding API_KEY to environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

export const interpretDream = async (dream: string, language: Language): Promise<DreamPrediction> => {
    try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze this dream: "${dream}" in ${language}. 
            CRITICAL: Result must be 1-2 balanced sentences per field.
            Provide JSON.`,
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
        return JSON.parse(response.text || '{}');
    } catch (e) {
        console.error("Interpret Error:", e);
        return { 
            generalMeaning: "Error occurred", 
            nextDayAdvice: "Check connection", 
            luckPercentage: 50, 
            sentiment: 'neutral', 
            psychologicalInsight: "", 
            story: "", 
            offline: true 
        };
    }
};

export const translateForImage = async (prompt: string): Promise<string> => {
    try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate this dream to a professional English art prompt: "${prompt}". Return ONLY the translation.`,
        });
        return response.text || prompt;
    } catch {
        return prompt;
    }
};

export const generateImageFromDream = async (prompt: string): Promise<string> => {
    const ai = getAiInstance();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { 
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
                ]
            },
        });

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) return part.inlineData.data;
            }
        }
        throw new Error("No image generated");
    } catch (e: any) {
        if (e.message?.includes("safety") || e.message?.includes("blocked")) {
            throw new SafetyError("Safety filter blocked this content.");
        }
        throw e;
    }
};

export const getDreamSymbolMeaning = async (symbol: string, language: Language): Promise<DreamSymbolMeaning> => {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Symbol meaning: "${symbol}" in ${language}. JSON.`,
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
    try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `One short mystical prediction in ${language}.`,
        });
        return { prediction: response.text || "Today is magical." };
    } catch {
        return { prediction: "Dreams await you." };
    }
};

export const getCardPrediction = async (cardType: string, language: Language): Promise<CardPredictionResult> => {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Prediction for ${cardType} in ${language}. Max 15 words.`,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: { type: Type.OBJECT, properties: { prediction: { type: Type.STRING } }, required: ['prediction'] } 
        }
    });
    return JSON.parse(response.text || '{"prediction": "..."}');
};

export const getDreamState = async (dreams: StoredDream[], language: Language): Promise<DreamAnalysis> => {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze dreamer state from these dreams: ${dreams.map(d => d.dream).join(';')}. Language: ${language}.`,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: { 
                type: Type.OBJECT, 
                properties: { 
                    state: { type: Type.STRING, enum: ['good', 'warning', 'warm', 'dark'] }, 
                    reason: { type: Type.STRING } 
                }, 
                required: ['state', 'reason'] 
            } 
        }
    });
    return JSON.parse(response.text || '{"state": "good", "reason": "Stable"}');
};

export const generateDreamFromSymbols = async (symbols: string[], language: Language, settings?: any): Promise<DreamMachineResult> => {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Story from symbols: ${symbols.join(',')}. Language: ${language}. Max 60 words.`,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: { 
                type: Type.OBJECT, 
                properties: { 
                    title: { type: Type.STRING }, 
                    story: { type: Type.STRING }, 
                    interpretation: { type: Type.STRING } 
                }, 
                required: ['title', 'story', 'interpretation'] 
            } 
        }
    });
    return JSON.parse(response.text || '{}');
};

export const getDreamTestChoices = async (dreams: StoredDream[], language: Language): Promise<string[]> => {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `4 abstract themes in ${language} based on these dreams: ${dreams.map(d => d.dream).join(';')}.`,
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
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Personality analysis for choice "${choice}" in ${language}.`,
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
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Map nodes and links for this dream: "${dream}" in ${language}. Max 5 nodes.`,
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
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Short welcome message as a Dream Coach in ${language} for a user who has these dreams: ${dreams.map(d => d.dream).join(';')}.`,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: { type: Type.OBJECT, properties: { message: {type: Type.STRING} }, required: ['message'] } 
        }
    });
    return JSON.parse(response.text || '{"message": "Welcome back!"}');
};

export const getCountryDreamStats = async (country: string, language: Language): Promise<CountryDreamStats> => {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Dream trends in ${country} in ${language}. JSON format.`,
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
    const ai = getAiInstance();
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
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    return await response.blob();
};
