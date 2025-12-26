
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

const getAiInstance = () => {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === 'undefined' || apiKey === '' || apiKey.length < 10) {
        console.error("CRITICAL: API_KEY is missing or invalid in environment variables.");
        throw new Error("API_KEY_NOT_CONFIGURED");
    }
    
    return new GoogleGenAI({ apiKey });
};

export const interpretDream = async (dream: string, language: Language): Promise<DreamPrediction> => {
    try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze this dream: "${dream}" in ${language}. Provide the analysis in JSON format according to the schema.`,
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

        const text = response.text;
        if (!text) throw new Error("Empty response from AI");
        
        return JSON.parse(text);
    } catch (e: any) {
        console.error("Interpret Dream Error:", e);
        
        let errorMsg = "Tushni tahlil qilishda xatolik yuz berdi.";
        
        if (e.message === "API_KEY_NOT_CONFIGURED") {
            errorMsg = "Xatolik: API kalit topilmadi. Hosting sozlamalarida API_KEY o'rnatilganini tekshiring.";
        } else if (e.message.includes("403") || e.message.includes("429")) {
            errorMsg = "API limiti tugadi yoki ruxsat berilmadi. Iltimos, birozdan so'ng urining.";
        }
        
        return { 
            generalMeaning: errorMsg, 
            nextDayAdvice: "Xatolik tafsilotlari konsolda mavjud.", 
            luckPercentage: 0, 
            sentiment: 'neutral', 
            psychologicalInsight: "AI xizmati bilan bog'lanib bo'lmadi.", 
            story: "", 
            offline: true 
        };
    }
};

// Boshqa barcha funksiyalarni ham shunday himoyalangan formatga o'tkazamiz
export const getDreamSymbolMeaning = async (symbol: string, language: Language): Promise<DreamSymbolMeaning> => {
    try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Explain dream symbol "${symbol}" in ${language}. Return JSON.`,
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
    } catch (e) {
        console.error("Symbol Meaning Error:", e);
        return {
            symbol: symbol,
            islamic: "Ma'lumot yuklashda xatolik.",
            psychological: "Xizmat vaqtincha ishlamayapti.",
            lifeAdvice: "Iltimos, qayta urining."
        };
    }
};

// ... qolgan funksiyalar (translateForImage, generateImageFromDream va h.k.) o'zgarishsiz qoladi, 
// lekin getAiInstance() orqali himoyalangan bo'ladi.

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
    try {
        const ai = getAiInstance();
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
        throw new Error("No image data returned");
    } catch (e: any) {
        if (e.message?.includes("SAFETY")) throw new SafetyError("Xavfsizlik filtri blokladi.");
        throw e;
    }
};

export const getGeneralDailyPrediction = async (language: Language): Promise<{ prediction: string }> => {
    try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Short daily mystical prediction in ${language}.`,
        });
        return { prediction: response.text || "Bugun tushlar sirlarga boy kun bo'ladi." };
    } catch {
        return { prediction: "Yulduzlar tushlaringizni kuzatmoqda." };
    }
};

export const getCardPrediction = async (cardType: string, language: Language): Promise<CardPredictionResult> => {
    try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Prediction for ${cardType} card in ${language}. Max 15 words.`,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: { type: Type.OBJECT, properties: { prediction: { type: Type.STRING } }, required: ['prediction'] } 
            }
        });
        return JSON.parse(response.text || '{"prediction": "Kelajak sirlari hali ochilmagan."}');
    } catch {
        return { prediction: "Karta siri vaqtincha yopiq." };
    }
};

export const getDreamState = async (dreams: StoredDream[], language: Language): Promise<DreamAnalysis> => {
    try {
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
    } catch {
        return { state: 'good', reason: "Tahlil qilinmoqda..." };
    }
};

export const generateDreamFromSymbols = async (symbols: string[], language: Language, settings?: any): Promise<DreamMachineResult> => {
    try {
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
    } catch {
        throw new Error("Dream Machine xatosi");
    }
};

export const getDreamTestChoices = async (dreams: StoredDream[], language: Language): Promise<string[]> => {
    try {
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
    } catch {
        return ["Sirli o'rmon", "Cheksiz koinot", "Qadimiy qasr", "Nurlu shahar"];
    }
};

export const getPersonalityTest = async (dreams: StoredDream[], language: Language, choice: string): Promise<DreamTestResult> => {
    try {
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
    } catch {
        return { personalityType: "Tadqiqotchi", analysis: "Siz tushlar olamini o'rganuvchi insonsiz.", advice: "O'z his-tuyg'ularingizga ishoning." };
    }
};

export const getDreamMapData = async (dream: string, language: Language): Promise<DreamMapData> => {
    try {
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
    } catch {
        return { nodes: [], links: [] };
    }
};

export const getDreamCoachInitialMessage = async (dreams: StoredDream[], language: Language): Promise<{ message: string }> => {
    try {
        const ai = getAiInstance();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Dream Coach welcome in ${language} for user with dreams: ${dreams.map(d => d.dream).join(';')}.`,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: { type: Type.OBJECT, properties: { message: {type: Type.STRING} }, required: ['message'] } 
            }
        });
        return JSON.parse(response.text || '{"message": "Xush kelibsiz! Tushlaringiz haqida gaplashamizmi?"}');
    } catch {
        return { message: "Salom! Men tushlar bo'yicha murabbiyingizman." };
    }
};

export const getCountryDreamStats = async (country: string, language: Language): Promise<CountryDreamStats> => {
    try {
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
    } catch {
        return { country, trends: [], analysis: "Ma'lumot topilmadi." };
    }
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
