
export type Language = 'uz' | 'en' | 'ar' | 'es' | 'fr' | 'ru' | 'de' | 'ja' | 'ko' | 'it';

export type Theme = 'default' | 'nature' | 'ocean' | 'sunset' | 'royal' | 'monochrome';

export interface Translations {
  [key: string]: any;
}

export type View = 'home' | 'dreamJourney' | 'calendar' | 'encyclopedia' | 'cards' | 'premium' | 'chat' | 'settings' | 'dreamMachine' | 'meditation' | 'challenges' | 'dreamProfile' | 'dreamCoach' | 'dreamMap' | 'publicDreams' | 'analysisMethods' | 'visualizeDream' | 'blog' | 'community' | 'dreamGallery';

export interface DreamPrediction {
  generalMeaning: string;
  nextDayAdvice: string;
  luckPercentage: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  psychologicalInsight: string;
  story: string;
  offline?: boolean;
}

export interface StoredDream {
  id: string; // Added ID for comments/tags
  date: string;
  dream: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  reflection?: string;
  tags?: string[]; // Added tags
}

export interface DreamImage {
    id: string;
    imageUrl: string;
    prompt: string;
    style: string;
    date: string;
}

export interface DeepSummary {
  summary: string;
  futurePrediction: string;
}

export interface CardPredictionResult {
    prediction: string;
}

export interface DreamSymbolMeaning {
  symbol: string;
  islamic: string;
  psychological: string;
  lifeAdvice: string;
}

export interface ProfileStats {
    dreamCount: number;
    commonSymbols: { word: string, count: number }[];
    moods: {
      positive: number;
      neutral: number;
      negative: number;
    };
    rank: string;
    dreamPoints: number;
}

export interface DreamMachineResult {
    title: string;
    story: string;
    interpretation: string;
}

export interface DreamTestResult {
    personalityType: string;
    analysis: string;
    advice: string;
}

export interface DreamMapData {
    nodes: { 
        id: string; 
        group: 'person' | 'place' | 'object' | 'emotion' | 'action';
        description: string;
    }[];
    links: { source: string; target: string; label: string }[];
}

export interface DreamAnalysis {
    state: 'good' | 'warning' | 'warm' | 'dark';
    reason: string;
}

export interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    image: string;
    category: 'Psychology' | 'Science' | 'Spirituality';
}

export interface Comment {
    id: string;
    author: string;
    text: string;
    date: string;
}

export interface CommunityPost {
    id: string;
    dream: string;
    authorAlias: string;
    date: string;
    likes: number;
    comments: Comment[];
    tags: string[];
}

export interface CountryDreamStats {
    country: string;
    trends: { theme: string; percentage: number }[];
    analysis: string;
}