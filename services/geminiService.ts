
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

// Offline fallback dictionary for common symbols
export const offlineDictionaries: any = {
    en: {
        'snake': { islamic: "Often represents an enemy or hidden danger.", psychological: "Symbol of transformation, sexuality, or wisdom.", advice: "Be cautious of people around you." },
        'water': { islamic: "Clear water represents prosperity and joy.", psychological: "Deep emotions and the subconscious mind.", advice: "Trust your intuition." },
        'fly': { islamic: "A journey or high status in life.", psychological: "A desire for freedom or escape.", advice: "Look at your situation from a new perspective." },
        positiveWords: ['happy', 'joy', 'love', 'fly', 'beautiful'],
        negativeWords: ['sad', 'fear', 'fall', 'death', 'snake'],
    },
    uz: {
        'ilon': { islamic: "Dushman yoki yashirin xavfni bildiradi.", psychological: "O'zgarish, jinsiyat yoki donolik ramzi.", advice: "Atrofingizdagilarga ehtiyotkor bo'ling." },
        'suv': { islamic: "Tiniq suv baraka va shodlik belgisidir.", psychological: "Chuqur his-tuyg'ular va ong osti olami.", advice: "Ichki tuyg'ularingizga ishoning." },
        'uchish': { islamic: "Sayohat yoki hayotda yuqori martabaga erishish.", psychological: "Ozodlikka intilish yoki muammolardan qochish.", advice: "Vaziyatga yangi nuqtai nazardan qarang." },
        'tish': { islamic: "Qarindoshlar yoki mol-mulkka ishora.", psychological: "O'ziga bo'lgan ishonchni yo'qotish qo'rquvi.", advice: "Salomatligingizga e'tiborliroq bo'ling." },
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

const getApiKey = () => {
    const key = process.env.API_KEY;
    if (!key || key === 'API_KEY') {
        throw new Error("API Key is not configured correctly. Please provide a valid key from Google AI Studio.");
    }
    return key;
};

export const interpretDream = async (dream: string, language: Language): Promise<DreamPrediction> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze this dream: "${dream}" in language: ${language}. Respond in JSON with: generalMeaning, nextDayAdvice, luckPercentage(int 0-100), sentiment(positive/neutral/negative), psychologicalInsight, story(short mystical narrative).`,
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
        console.error("Interpret AI failed", e);
        return {
            generalMeaning: "Internal reflection and subconscious processing.",
            nextDayAdvice: "Today, try to stay observant and trust your intuition.",
            luckPercentage: 75,
            sentiment: 'neutral',
            psychologicalInsight: "Your mind is currently integrating recent experiences.",
            story: "In the garden of your mind, a new path is revealing itself through the symbols of your sleep.",
            offline: true
        };
    }
};

export const getDreamSymbolMeaning = async (symbol: string, language: Language): Promise<DreamSymbolMeaning> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Provide dream interpretation for the symbol: "${symbol}" in ${language}. Include: islamic (Ibn Sirin style), psychological (Jungian/Freudian), and lifeAdvice.`,
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
        console.error("Symbol AI failed", e);
        const term = symbol.toLowerCase().trim();
        const langDict = offlineDictionaries[language] || offlineDictionaries.en;
        if (langDict[term]) {
            return {
                symbol: symbol,
                islamic: langDict[term].islamic,
                psychological: langDict[term].psychological,
                lifeAdvice: langDict[term].advice
            };
        }
        throw new Error("Could not find information for this symbol. Please check your API key.");
    }
};

export const getGeneralDailyPrediction = async (language: Language): Promise<{ prediction: string }> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a short, unique, mystical and positive daily prediction message in ${language}. Max 15 words.`,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: { 
                    type: Type.OBJECT, 
                    properties: { prediction: { type: Type.STRING } }, 
                    required: ['prediction'] 
                } 
            }
        });
        return JSON.parse(response.text || '{"prediction": "Today is full of magic."}');
    } catch (e) {
        return { prediction: language === 'uz' ? "Bugungi kuningiz tushlardek sirli va ajoyib o'tadi." : "Your day will be as mystical and wonderful as a dream." };
    }
};

export const getCardPrediction = async (cardType: string, language: Language): Promise<CardPredictionResult> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a mystical prediction for a tarot card themed around "${cardType}" in ${language}. Be poetic.`,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: { 
                    type: Type.OBJECT, 
                    properties: { prediction: { type: Type.STRING } }, 
                    required: ['prediction'] 
                } 
            }
        });
        return JSON.parse(response.text || '{"prediction": "..."}');
    } catch (e) {
        return { prediction: "Taqdir yo'llari hozircha yopiq, birozdan so'ng qayta urinib ko'ring." };
    }
};

export const getDreamState = async (dreams: StoredDream[], language: Language): Promise<DreamAnalysis> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze these dreams and return the overall psychological state: ${dreams.map(d => d.dream).join(';')}. Language: ${language}`,
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
        return JSON.parse(response.text || '{"state": "good", "reason": "Your psyche is in balance."}');
    } catch (e) {
        return { state: 'warm', reason: 'Tushlaringiz barqaror holatda, ruhiyangiz tinch.' };
    }
};

export const generateDreamFromSymbols = async (symbols: string[], language: Language, settings?: any): Promise<DreamMachineResult> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Create a dream story based on these symbols: ${symbols.join(',')}. Language: ${language}. Settings: ${JSON.stringify(settings)}`,
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
    } catch (e) {
        return { title: 'Mystical Story', story: 'Your symbols weave a tapestry of silence and shadow...', interpretation: 'Focus on your inner peace today.' };
    }
};

export const getDreamTestChoices = async (dreams: StoredDream[], language: Language): Promise<string[]> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Based on these dreams, provide 4 unique archetypal theme choices for a personality test: ${dreams.map(d => d.dream).join(';')}. Language: ${language}`,
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
        return ['Sarguzasht', 'Qo\'rquv', 'Donolik', 'Tabiat'];
    }
};

export const getPersonalityTest = async (dreams: StoredDream[], language: Language, choice: string): Promise<DreamTestResult> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze personality based on previous dreams and the selected archetype: "${choice}". Language: ${language}`,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: { 
                    type: Type.OBJECT, 
                    properties: { 
                        personalityType: { type: Type.STRING }, 
                        analysis: { type: Type.STRING }, 
                        advice: { type: Type.STRING } 
                    }, 
                    required: ['personalityType', 'analysis', 'advice'] 
                } 
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) {
        return { personalityType: 'Tadqiqotchi', analysis: 'Siz tushlar olamini o\'rganuvchisiz.', advice: 'Tushlaringizni yozib borishda davom eting.' };
    }
};

export const getDreamMapData = async (dream: string, language: Language): Promise<DreamMapData> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Extract nodes (person/place/object/emotion/action) and links between them from this dream: "${dream}". Respond in JSON. Language: ${language}`,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: { 
                    type: Type.OBJECT, 
                    properties: { 
                        nodes: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT, 
                                properties: { 
                                    id: {type: Type.STRING}, 
                                    group: {type: Type.STRING, enum: ['person', 'place', 'object', 'emotion', 'action']}, 
                                    description: {type: Type.STRING} 
                                } 
                            } 
                        }, 
                        links: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT, 
                                properties: { 
                                    source: {type: Type.STRING}, 
                                    target: {type: Type.STRING}, 
                                    label: {type: Type.STRING} 
                                } 
                            } 
                        } 
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
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are a Dream Coach. Provide a warm, personalized greeting based on these recent dreams: ${dreams.map(d => d.dream).join(';')}. Language: ${language}`,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: { 
                    type: Type.OBJECT, 
                    properties: { message: {type: Type.STRING} }, 
                    required: ['message'] 
                } 
            }
        });
        return JSON.parse(response.text || '{"message": "Xush kelibsiz!"}');
    } catch (e) {
        return { message: "Xush kelibsiz! Bugun tushingiz haqida nimalarni o'rganishni istaysiz?" };
    }
};

export const generateImageFromDream = async (prompt: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { 
                responseModalities: [Modality.IMAGE],
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
                ]
            },
        });
        if (response?.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) return part.inlineData.data;
            }
        }
        throw new SafetyError("Image content blocked or could not be generated.");
    } catch (e) {
        console.error("Image failed", e);
        throw e;
    }
};

export const getCountryDreamStats = async (country: string, language: Language): Promise<CountryDreamStats> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate hypothetical but culturally realistic dream statistics for ${country} in ${language}. Return JSON.`,
            config: { 
                responseMimeType: "application/json", 
                responseSchema: { 
                    type: Type.OBJECT, 
                    properties: { 
                        country: { type: Type.STRING }, 
                        trends: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT, 
                                properties: { 
                                    theme: {type: Type.STRING}, 
                                    percentage: {type: Type.INTEGER} 
                                } 
                            } 
                        }, 
                        analysis: { type: Type.STRING } 
                    }, 
                    required: ['country', 'trends', 'analysis'] 
                } 
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) {
        return { country, trends: [], analysis: "Global ma'lumotlar hozircha mavjud emas." };
    }
};

export const generateVideoFromDream = async (prompt: string, aspectRatio: '16:9' | '9:16', resolution: '720p' | '1080p'): Promise<Blob> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: { 
                numberOfVideos: 1, 
                resolution: resolution, 
                aspectRatio: aspectRatio 
            }
        });
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation failed: Link not found.");
        const response = await fetch(`${downloadLink}&key=${getApiKey()}`);
        return await response.blob();
    } catch (e: any) {
        if (e.message && e.message.includes("Requested entity was not found.")) {
             throw new Error("Requested entity was not found. This might be an API key issue.");
        }
        throw e;
    }
};
