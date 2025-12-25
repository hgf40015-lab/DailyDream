
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
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

// Offline fallback
export const offlineDictionaries: any = {
    en: { positiveWords: ['happy', 'joy'], negativeWords: ['sad', 'fear'] },
    uz: { positiveWords: ['baxtli', 'shodlik'], negativeWords: ['xafa', 'qo\'rquv'] }
};

export const symbolAudioMap: { [key: string]: string } = {
    water: 'https://cdn.pixabay.com/audio/2022/02/04/audio_32b0a9f60f.mp3',
    suv: 'https://cdn.pixabay.com/audio/2022/02/04/audio_32b0a9f60f.mp3',
};

const getAiInstance = () => {
    const apiKey = process.env.API_KEY;
    
    // Qat'iy tekshiruv: agar kalit yo'q bo'lsa yoki "undefined" string bo'lib kelib qolsa
    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
        throw new Error("API_KEY_MISSING: Vercel sozlamalarida API_KEY topilmadi yoki loyiha qayta Deploy qilinmagan.");
    }
    
    return new GoogleGenAI({ apiKey });
};

export const interpretDream = async (dream: string, language: Language): Promise<DreamPrediction> => {
    try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze this dream: "${dream}" in ${language}. Result in JSON.`,
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
    } catch (e: any) {
        console.error("Interpret Error:", e);
        const errorMsg = e.message?.includes("API_KEY_MISSING") 
            ? "API kaliti ulanmagan. Iltimos, loyihani Vercel-da Redeploy qiling." 
            : "Xizmatda vaqtincha uzilish. Qayta urinib ko'ring.";
        
        return { 
            generalMeaning: errorMsg, 
            nextDayAdvice: "Sozlamalarni tekshiring", 
            luckPercentage: 0, 
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
            contents: `Translate to English art prompt: "${prompt}". Return ONLY translation.`,
        });
        return response.text?.trim() || prompt;
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
        throw new Error("Rasm yaratilmadi.");
    } catch (e: any) {
        if (e.message?.includes("SAFETY") || e.message?.includes("blocked")) {
            throw new SafetyError("Xavfsizlik filtri blokladi.");
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
            contents: `Short daily mystical prediction in ${language}.`,
        });
        return { prediction: response.text || "Bugun sehrli kun." };
    } catch {
        return { prediction: "Tushlar sizni chorlaydi." };
    }
};

export const getCardPrediction = async (cardType: string, language: Language): Promise<CardPredictionResult> => {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Prediction for ${cardType} card in ${language}. Max 15 words.`,
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
        contents: `Analyze dreamer state: ${dreams.map(d => d.dream).join(';')}. Language: ${language}.`,
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
        contents: `Story from symbols: ${symbols.join(',')}. Language: ${language}.`,
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
        contents: `4 abstract themes in ${language} from: ${dreams.map(d => d.dream).join(';')}.`,
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
        contents: `Personality for choice "${choice}" in ${language}.`,
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
        contents: `Map nodes for dream: "${dream}" in ${language}.`,
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
        contents: `Dream Coach welcome in ${language} for user with dreams: ${dreams.map(d => d.dream).join(';')}.`,
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
        contents: `Dream trends in ${country} in ${language}.`,
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
