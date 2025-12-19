
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

// Global dictionary for offline fallback
export const offlineDictionaries: any = {
    en: {
        'snake': { islamic: "Often represents an enemy or hidden danger.", psychological: "Symbol of transformation or wisdom.", advice: "Be cautious of your surroundings." },
        'water': { islamic: "Clear water is a sign of prosperity and joy.", psychological: "Deep emotions and the subconscious mind.", advice: "Trust your intuition today." },
        'fly': { islamic: "A journey or high status in life.", psychological: "A desire for freedom.", advice: "Try to look at your situation from a different perspective." },
        positiveWords: ['happy', 'joy', 'love', 'fly', 'beautiful'],
        negativeWords: ['sad', 'fear', 'fall', 'death', 'snake'],
    },
    uz: {
        'ilon': { islamic: "Dushman yoki yashirin xavfni bildiradi.", psychological: "O'zgarish yoki donolik ramzi.", advice: "Atrofingizdagilarga ehtiyotkor bo'ling." },
        'suv': { islamic: "Tiniq suv baraka va shodlik belgisidir.", psychological: "Chuqur his-tuyg'ular va ong osti olami.", advice: "Bugun ichki tuyg'ularingizga ishoning." },
        'uchish': { islamic: "Sayohat yoki hayotda yuqori martabaga erishish.", psychological: "Ozodlikka intilish.", advice: "Vaziyatga yangi nuqtai nazardan qarang." },
        'tish': { islamic: "Qarindoshlar yoki mol-mulkka ishora.", psychological: "O'ziga bo'lgan ishonchni yo'qotish qo'rquvi.", advice: "Salomatligingizga e'tiborli bo'ling." },
        positiveWords: ['baxtli', 'shodlik', 'sevgi', 'uchish', 'go\'zal'],
        negativeWords: ['xafa', 'qo\'rquv', 'yiqilish', 'o\'lim', 'ilon'],
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

const getAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'API_KEY') {
        // This is a special error we catch in the UI to guide the user
        throw new Error("API_KEY_LITERAL_TEXT_ERROR");
    }
    return new GoogleGenAI({ apiKey });
};

export const interpretDream = async (dream: string, language: Language): Promise<DreamPrediction> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze: "${dream}" in ${language}. JSON format: generalMeaning, nextDayAdvice, luckPercentage(int), sentiment, psychologicalInsight, story.`,
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
        return { ...JSON.parse(response.text || '{}'), offline: false };
    } catch (e) {
        console.error("AI interpretation failed", e);
        return {
            generalMeaning: "Internal reflection and psychological processing.",
            nextDayAdvice: "Stay mindful and observe your feelings today.",
            luckPercentage: 70,
            sentiment: 'neutral',
            psychologicalInsight: "Your dream suggests a need for balance.",
            story: "In the depth of the night, your soul spoke in symbols.",
            offline: true
        };
    }
};

export const getDreamSymbolMeaning = async (symbol: string, language: Language): Promise<DreamSymbolMeaning> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Meaning of symbol: "${symbol}" in ${language}. Include islamic (Ibn Sirin style), psychological, lifeAdvice.`,
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
    } catch (e: any) {
        if (e.message === "API_KEY_LITERAL_TEXT_ERROR") throw e;
        
        const term = symbol.toLowerCase().trim();
        const dict = offlineDictionaries[language] || offlineDictionaries.en;
        if (dict[term]) return { symbol, ...dict[term] };
        throw new Error("API_ERROR");
    }
};

export const getGeneralDailyPrediction = async (language: Language): Promise<{ prediction: string }> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Mystical daily fortune message in ${language}. Short, max 15 words.`,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: { type: Type.OBJECT, properties: { prediction: { type: Type.STRING } }, required: ['prediction'] } 
            }
        });
        return JSON.parse(response.text || '{"prediction": "Bugun sehrli kun."}');
    } catch (e) {
        return { prediction: language === 'uz' ? "Bugungi kuningiz tushlardek ajoyib o'tadi." : "Your day will be as wonderful as a dream." };
    }
};

export const getCardPrediction = async (cardType: string, language: Language): Promise<CardPredictionResult> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Prediction for ${cardType} tarot card in ${language}. Be poetic and brief.`,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: { type: Type.OBJECT, properties: { prediction: { type: Type.STRING } }, required: ['prediction'] } 
            }
        });
        return JSON.parse(response.text || '{"prediction": "..."}');
    } catch (e) {
        return { prediction: "Taqdir yo'llari hozircha sirli bo'lib qoladi." };
    }
};

export const getDreamState = async (dreams: StoredDream[], language: Language): Promise<DreamAnalysis> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze psyche based on these dreams: ${dreams.map(d => d.dream).join(';')}. Language: ${language}`,
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
    } catch (e) {
        return { state: 'warm', reason: 'Ruhiyangiz tinch va barqaror holatda.' };
    }
};

export const generateDreamFromSymbols = async (symbols: string[], language: Language, settings?: any): Promise<DreamMachineResult> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Create a dream story based on: ${symbols.join(',')}. Language: ${language}. Settings: ${JSON.stringify(settings)}`,
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
    } catch (e) {
        return { title: 'Story', story: 'Your imagination creates the world...', interpretation: 'Listen to your inner voice.' };
    }
};

export const getDreamTestChoices = async (dreams: StoredDream[], language: Language): Promise<string[]> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Provide 4 unique mystical themes based on these dreams: ${dreams.map(d => d.dream).join(';')}. Language: ${language}`,
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
    } catch (e) {
        return ['Wisdom', 'Courage', 'Nature', 'Mystery'];
    }
};

export const getPersonalityTest = async (dreams: StoredDream[], language: Language, choice: string): Promise<DreamTestResult> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze personality based on choice "${choice}" and previous dreams. Language: ${language}`,
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
    } catch (e) {
        return { personalityType: 'Explorer', analysis: 'You seek deep truths.', advice: 'Keep recording your dreams.' };
    }
};

export const getDreamMapData = async (dream: string, language: Language): Promise<DreamMapData> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Extract nodes and links for a knowledge map from this dream: "${dream}". Language: ${language}`,
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
    } catch (e) {
        return { nodes: [], links: [] };
    }
};

export const getDreamCoachInitialMessage = async (dreams: StoredDream[], language: Language): Promise<{ message: string }> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `As a Dream Coach, greet user warmly based on their history: ${dreams.map(d => d.dream).join(';')}. Language: ${language}`,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: { type: Type.OBJECT, properties: { message: {type: Type.STRING} }, required: ['message'] } 
            }
        });
        return JSON.parse(response.text || '{"message": "Welcome!"}');
    } catch (e) {
        return { message: "Welcome! Tell me about your dream." };
    }
};

export const generateImageFromDream = async (prompt: string): Promise<string> => {
    try {
        const ai = getAI();
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
    } catch (e) {
        console.error("Image failed", e);
        throw e;
    }
};

export const getCountryDreamStats = async (country: string, language: Language): Promise<CountryDreamStats> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate hypothetical but culturally realistic dream trends for ${country}. Language: ${language}`,
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
    } catch (e) {
        return { country, trends: [], analysis: "Data unavailable." };
    }
};

export const generateVideoFromDream = async (prompt: string, aspectRatio: '16:9' | '9:16', resolution: '720p' | '1080p'): Promise<Blob> => {
    const ai = getAI();
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
