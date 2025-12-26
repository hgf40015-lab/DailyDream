
export type FeatureType = 'interpret' | 'image' | 'chat' | 'dictionary' | 'machine' | 'map' | 'video';

const LIMITS: Record<FeatureType, number> = {
    interpret: 5,
    image: 3,
    chat: 15,
    dictionary: 10,
    machine: 3,
    map: 5,
    video: 1
};

interface UsageData {
    count: number;
    lastReset: string; // ISO date string
}

export const checkLimit = (feature: FeatureType): { canUse: boolean; remaining: number } => {
    const usageRaw = localStorage.getItem(`usage_${feature}`);
    const today = new Date().toDateString();
    
    if (!usageRaw) {
        return { canUse: true, remaining: LIMITS[feature] };
    }

    try {
        const data: UsageData = JSON.parse(usageRaw);
        
        // Agar yangi kun boshlangan bo'lsa, limitni yangilaymiz
        if (new Date(data.lastReset).toDateString() !== today) {
            localStorage.removeItem(`usage_${feature}`);
            return { canUse: true, remaining: LIMITS[feature] };
        }

        return { 
            canUse: data.count < LIMITS[feature], 
            remaining: Math.max(0, LIMITS[feature] - data.count) 
        };
    } catch (e) {
        localStorage.removeItem(`usage_${feature}`);
        return { canUse: true, remaining: LIMITS[feature] };
    }
};

export const incrementUsage = (feature: FeatureType) => {
    const usageRaw = localStorage.getItem(`usage_${feature}`);
    const today = new Date().toISOString();
    let data: UsageData = { count: 0, lastReset: today };

    if (usageRaw) {
        try {
            data = JSON.parse(usageRaw);
            // Kunni tekshirish
            if (new Date(data.lastReset).toDateString() !== new Date().toDateString()) {
                data.count = 0;
                data.lastReset = today;
            }
        } catch (e) {
            data = { count: 0, lastReset: today };
        }
    }

    data.count += 1;
    localStorage.setItem(`usage_${feature}`, JSON.stringify(data));
};

export const getLimitInfo = (feature: FeatureType) => {
    const { remaining } = checkLimit(feature);
    return `${remaining} / ${LIMITS[feature]}`;
};
