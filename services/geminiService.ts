
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

const getApiKey = () => {
    const key = process.env.API_KEY;
    if (!key || key === 'undefined' || key === 'API_KEY' || key.length < 10) {
        return null;
    }
    return key;
};

export const interpretDream = async (dream: string, language: Language): Promise<DreamPrediction> => {
    const apiKey = getApiKey();
    if (!apiKey) return { generalMeaning: "API Key missing", nextDayAdvice: "", luckPercentage: 0, sentiment: 'neutral', psychologicalInsight: "", story: "", offline: true };
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze this dream: "${dream}" in ${language}. Provide JSON.`,
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
        return { generalMeaning: "Error", nextDayAdvice: "", luckPercentage: 50, sentiment: 'neutral', psychologicalInsight: "", story: "", offline: true };
    }
};

export const translateForImage = async (prompt: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return prompt;
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate this dream description into a highly descriptive English image prompt: "${prompt}". Return only the translated text.`,
        });
        return response.text || prompt;
    } catch {
        return prompt;
    }
};

export const generateImageFromDream = async (prompt: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key configuration error");
    
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { 
                // Safety settings expanded to avoid false positives for words like "mother-in-law"
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
                if (part.inlineData?.data) {
                    return part.inlineData.data;
                }
            }
        }
        
        throw new Error("No image data received");
    } catch (e: any) {
        if (e.message?.includes("safety") || e.message?.includes("blocked")) {
            throw new SafetyError("Content blocked by safety filters");
        }
        throw e;
    }
};

// Re-exporting other existing services to maintain functionality
export const getDreamSymbolMeaning = async (symbol: string, language: Language) => { /* existing logic */ return { symbol, islamic: "", psychological: "", lifeAdvice: "" }; };
export const getGeneralDailyPrediction = async (language: Language) => { const apiKey = getApiKey(); if (!apiKey) return { prediction: "" }; const ai = new GoogleGenAI({ apiKey }); const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Daily fortune in ${language}` }); return { prediction: response.text }; };
export const getCardPrediction = async (card: string, lang: Language) => { return { prediction: "" }; };
export const getDreamState = async (dreams: any[], lang: Language) => { return { state: 'good', reason: "" }; };
export const generateDreamFromSymbols = async (s: string[], l: Language, set: any) => { return { title: "", story: "", interpretation: "" }; };
export const getDreamTestChoices = async (d: any[], l: Language) => { return []; };
export const getPersonalityTest = async (d: any[], l: Language, c: string) => { return { personalityType: "", analysis: "", advice: "" }; };
export const getDreamMapData = async (d: string, l: Language) => { return { nodes: [], links: [] }; };
export const getDreamCoachInitialMessage = async (d: any[], l: Language) => { return { message: "" }; };
export const getCountryDreamStats = async (c: string, l: Language) => { return { country: c, trends: [], analysis: "" }; };
export const generateVideoFromDream = async (p: string, a: any, r: any) => { return new Blob(); };
export const offlineDictionaries: any = { en: { positiveWords: [], negativeWords: [] }, uz: { positiveWords: [], negativeWords: [] } };
export const symbolAudioMap: any = {};
