
import { GoogleGenAI, Type, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { 
    Language, 
    DreamPrediction, 
    DreamMachineResult,
    DeepSummary,
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

const getAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey });
};

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
];

// Symbols dictionary for offline fallback
type DreamDictionary = {
    [key: string]: string[];
};

type Dictionaries = {
    [lang in Language]?: {
        symbols: DreamDictionary;
        positiveWords: string[];
        negativeWords: string[];
        advice: string[];
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

export const offlineDictionaries: Dictionaries = {
    en: {
        symbols: {
            'water': ["represents emotional cleansing, your subconscious, or a fresh start."],
            'fly': ["suggests a sense of freedom, gaining a new perspective."],
            'snake': ["is a symbol of transformation, hidden fears, or healing energy."],
        },
        positiveWords: ['happy', 'joy', 'love', 'fly', 'beautiful'],
        negativeWords: ['sad', 'fear', 'fall', 'death', 'snake'],
        advice: ["Pay attention to your feelings today; they are trying to tell you something important."]
    },
    uz: {
        symbols: {
            'suv': ["hissiy tozalanish, ongingiz osti yoki yangi boshlanishni anglatadi."],
            'uchish': ["erkinlik hissi, yangi nuqtai nazarga ega bo'lishni taklif qiladi."],
            'ilon': ["o'zgarish, yashirin qo'rquvlar yoki shifobaxsh energiyaning ramzidir."],
        },
        positiveWords: ['baxtli', 'shodlik', 'sevgi', 'uchish', 'go\'zal'],
        negativeWords: ['xafa', 'qo\'rquv', 'yiqilish', 'o\'lim', 'ilon'],
        advice: ["Bugun his-tuyg'ularingizga e'tibor bering; ular sizga muhim narsani aytishga harakat qilmoqda."]
    }
};

const offlineTemplates: Record<string, any> = {
    en: { meaningIntro: "Your dream is a reflection of your inner world. ", noSymbol: "It seems to be about your daily thoughts and feelings.", insight: "This is a basic analysis.", story: "In a realm of slumber, your mind painted a scene." },
    uz: { meaningIntro: "Tushingiz ichki dunyongizning aksidir. ", noSymbol: "Bu sizning kundalik o'ylaringiz va his-tuyg'ularingiz haqida bo'lib tuyuladi.", insight: "Bu oddiy tahlil.", story: "Uyqu olamida ongingiz ruhingiz shivirlariga ishora qiluvchi manzarani chizdi." },
};

const getOfflineInterpretation = (dream: string, lang: Language): DreamPrediction => {
    const dictionary = offlineDictionaries[lang] || offlineDictionaries.en!;
    const templates = offlineTemplates[lang] || offlineTemplates.en;
    const dreamWords = dream.toLowerCase().match(/\b(\w+)\b/g) || [];
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    let positiveScore = 0; let negativeScore = 0;

    dreamWords.forEach(word => {
        if (dictionary.positiveWords.includes(word)) positiveScore++;
        if (dictionary.negativeWords.includes(word)) negativeScore++;
    });

    if (positiveScore > negativeScore) sentiment = 'positive';
    if (negativeScore > positiveScore) sentiment = 'negative';

    return {
        generalMeaning: templates.meaningIntro + (dictionary.symbols[dreamWords[0]]?.[0] || templates.noSymbol),
        nextDayAdvice: dictionary.advice[0],
        luckPercentage: 75,
        sentiment: sentiment,
        psychologicalInsight: templates.insight,
        story: templates.story,
        offline: true,
    };
};

// --- CORE FUNCTIONS USING GEMINI 3 ---

export const interpretDream = async (dream: string, language: Language): Promise<DreamPrediction> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Act as a mystical dream interpreter. Analyze: "${dream}". Language: "${language}". 
            Respond in JSON with: generalMeaning (string), nextDayAdvice (string), luckPercentage (int), sentiment (positive/neutral/negative), psychologicalInsight (string), story (short mystical narrative string).`,
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
                },
                safetySettings,
            },
        });

        if (!response.text) throw new Error("Empty response");
        return { ...JSON.parse(response.text), offline: false };
    } catch (e) {
        console.error("AI failed, offline mode", e);
        return getOfflineInterpretation(dream, language);
    }
};

export const getDreamSymbolMeaning = async (symbol: string, language: Language): Promise<DreamSymbolMeaning> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide detailed meaning for dream symbol "${symbol}" in ${language}. 
        Include: islamic interpretation (sources like Ibn Sirin), psychological meaning (Jungian), and life advice.`,
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
            },
            safetySettings,
        },
    });
    if (!response.text) throw new Error("API error");
    return JSON.parse(response.text);
};

export const getGeneralDailyPrediction = async (language: Language): Promise<{ prediction: string }> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a short, positive, mystical daily fortune cookie message in ${language}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { prediction: { type: Type.STRING } },
                required: ['prediction'],
            },
        },
    });
    return JSON.parse(response.text || '{"prediction": "Bugungi kuningiz ajoyib o\'tadi."}');
};

export const getCardPrediction = async (cardType: string, language: Language): Promise<CardPredictionResult> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a mystical one-sentence prediction for card theme "${cardType}" in ${language}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { prediction: { type: Type.STRING } },
                required: ['prediction'],
            },
        },
    });
    return JSON.parse(response.text || '{"prediction": "..."}');
};

export const getDreamState = async (dreams: StoredDream[], language: Language): Promise<DreamAnalysis> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze these dreams and return state (good/warning/warm/dark) and reason in ${language}. Dreams: ${dreams.map(d => d.dream).join(';')}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    state: { type: Type.STRING, enum: ['good', 'warning', 'warm', 'dark'] },
                    reason: { type: Type.STRING },
                },
                required: ['state', 'reason'],
            },
        },
    });
    return JSON.parse(response.text || '{"state": "good", "reason": "Tushlaringiz barqaror."}');
};

export const generateDreamFromSymbols = async (symbols: string[], language: Language, settings?: any): Promise<DreamMachineResult> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a dream story in ${language} from: ${symbols.join(',')}. Settings: ${JSON.stringify(settings)}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    story: { type: Type.STRING },
                    interpretation: { type: Type.STRING },
                },
                required: ['title', 'story', 'interpretation'],
            },
        },
    });
    return JSON.parse(response.text || '{}');
};

export const getDreamTestChoices = async (dreams: StoredDream[], language: Language): Promise<string[]> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Identify 4 core archetypal themes from these dreams in ${language}: ${dreams.map(d => d.dream).join(';')}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { themes: { type: Type.ARRAY, items: { type: Type.STRING } } },
                required: ['themes'],
            },
        },
    });
    return JSON.parse(response.text || '{"themes": []}').themes;
};

export const getPersonalityTest = async (dreams: StoredDream[], language: Language, choice: string): Promise<DreamTestResult> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze personality based on dreams and choice "${choice}" in ${language}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    personalityType: { type: Type.STRING },
                    analysis: { type: Type.STRING },
                    advice: { type: Type.STRING },
                },
                required: ['personalityType', 'analysis', 'advice'],
            },
        },
    });
    return JSON.parse(response.text || '{}');
};

export const getDreamMapData = async (dream: string, language: Language): Promise<DreamMapData> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Map the nodes and links of this dream in ${language}: "${dream}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: {type: Type.STRING}, group: {type: Type.STRING}, description: {type: Type.STRING} } } },
                    links: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: {type: Type.STRING}, target: {type: Type.STRING}, label: {type: Type.STRING} } } },
                },
                required: ['nodes', 'links'],
            },
        },
    });
    return JSON.parse(response.text || '{"nodes": [], "links": []}');
};

export const getDreamCoachInitialMessage = async (dreams: StoredDream[], language: Language): Promise<{ message: string }> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a Dream Coach. Greet user based on dreams: ${dreams.map(d => d.dream).join(';')}. Language: ${language}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { message: {type: Type.STRING} }, required: ['message'] },
        },
    });
    return JSON.parse(response.text || '{"message": "Xush kelibsiz!"}');
};

export const generateImageFromDream = async (prompt: string): Promise<string> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { responseModalities: [Modality.IMAGE], safetySettings },
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
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate dream stats for "${country}" in ${language}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    country: { type: Type.STRING },
                    trends: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { theme: {type: Type.STRING}, percentage: {type: Type.INTEGER} } } },
                    analysis: { type: Type.STRING },
                },
                required: ['country', 'trends', 'analysis'],
            },
        },
    });
    return JSON.parse(response.text || '{}');
};

// Fix: Add generateVideoFromDream function and export it.
export const generateVideoFromDream = async (prompt: string, aspectRatio: '16:9' | '9:16', resolution: '720p' | '1080p'): Promise<Blob> => {
    const ai = getAI();
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
    if (!downloadLink) {
        throw new Error("Video generation failed: No download link");
    }
    // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
    }
    return await response.blob();
};
