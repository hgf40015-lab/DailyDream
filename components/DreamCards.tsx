
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { getCardPrediction } from '../services/geminiService';
import { LoveCardIcon, WorkCardIcon, LuckCardIcon, JourneyCardIcon, WisdomCardIcon, ChallengeCardIcon, CreativityCardIcon, FriendshipCardIcon, HealthCardIcon } from './icons/Icons';

type CardType = 'Love' | 'Work' | 'Luck' | 'Journey' | 'Wisdom' | 'Challenge' | 'Creativity' | 'Friendship' | 'Health';

interface CardData {
  type: CardType;
  label: string;
  icon: React.ReactElement;
  color: string;
}

interface LastPickedCard {
    type: CardType;
    prediction: string;
    date: string;
}

// Har kuni kartalar joyini bir xil (lekin yangicha) aralashtirish uchun Seeded Random funksiyasi
const seededRandom = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    const x = Math.sin(hash) * 10000;
    return x - Math.floor(x);
};

const shuffleArray = <T,>(array: T[], seed: string): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(seed + i.toString()) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const DreamCards: React.FC = () => {
  const { translations, language } = useContext(LanguageContext);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [chosenCard, setChosenCard] = useState<CardType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canPickToday, setCanPickToday] = useState(false);
  const [lastPickedCard, setLastPickedCard] = useState<LastPickedCard | null>(null);

  const rawCardTypes: CardData[] = [
    { type: 'Love', label: translations.cardLove, icon: <LoveCardIcon />, color: "from-pink-500 to-rose-500" },
    { type: 'Work', label: translations.cardWork, icon: <WorkCardIcon />, color: "from-sky-500 to-indigo-500" },
    { type: 'Luck', label: translations.cardLuck, icon: <LuckCardIcon />, color: "from-amber-400 to-orange-500" },
    { type: 'Journey', label: translations.cardJourney, icon: <JourneyCardIcon />, color: "from-lime-500 to-emerald-600" },
    { type: 'Wisdom', label: translations.cardWisdom, icon: <WisdomCardIcon />, color: "from-violet-500 to-purple-600" },
    { type: 'Challenge', label: translations.cardChallenge, icon: <ChallengeCardIcon />, color: "from-red-600 to-red-800" },
    { type: 'Creativity', label: translations.cardCreativity, icon: <CreativityCardIcon />, color: "from-yellow-400 to-yellow-600" },
    { type: 'Friendship', label: translations.cardFriendship, icon: <FriendshipCardIcon />, color: "from-teal-400 to-cyan-500" },
    { type: 'Health', label: translations.cardHealth, icon: <HealthCardIcon />, color: "from-green-400 to-green-600" }
  ];

  // Bugungi sana asosida kartalarni aralashtirish
  const cardTypes = useMemo(() => {
      const todayString = new Date().toISOString().split('T')[0]; // "2025-05-24"
      return shuffleArray(rawCardTypes, todayString);
  }, [translations]);

  useEffect(() => {
    const checkDailyLimit = () => {
        const lastCardDataRaw = localStorage.getItem('last-picked-card-data');
        const todayString = new Date().toISOString().split('T')[0];

        if (lastCardDataRaw) {
            const data: LastPickedCard = JSON.parse(lastCardDataRaw);
            if (data.date === todayString) {
                setCanPickToday(false);
                setLastPickedCard(data);
                setPrediction(data.prediction);
            } else {
                setCanPickToday(true);
            }
        } else {
            setCanPickToday(true);
        }
    };

    checkDailyLimit();
  }, []);

  const handleCardPick = async (cardType: CardType) => {
    if (!canPickToday || isLoading || !language || chosenCard) return;

    setIsLoading(true);
    setError(null);
    setChosenCard(cardType);
    
    try {
      const result = await getCardPrediction(cardType, language);
      const todayString = new Date().toISOString().split('T')[0];
      
      const cardDataToSave = { 
          type: cardType, 
          prediction: result.prediction, 
          date: todayString 
      };

      // Ma'lumotlarni saqlash
      localStorage.setItem('last-picked-card-data', JSON.stringify(cardDataToSave));
      setPrediction(result.prediction);
      
      // Animatsiyadan so'ng holatni yangilash
      setTimeout(() => {
        setCanPickToday(false);
        setLastPickedCard(cardDataToSave);
      }, 1500);

    } catch (e) {
      setError(translations.error);
      setChosenCard(null);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getCardByType = (type: CardType) => rawCardTypes.find(c => c.type === type)!;

  const renderActiveResult = (card: CardData) => (
      <div className="w-full max-w-sm mx-auto bg-gray-900 rounded-[2.5rem] border-2 border-cyan-400/50 shadow-[0_0_60px_rgba(34,211,238,0.2)] flex flex-col items-center justify-center text-center animate-fade-in-up p-8 relative overflow-hidden h-[500px]">
        <div className={`absolute inset-0 bg-gradient-to-b ${card.color} opacity-10 animate-pulse`}></div>
        
        <div className={`w-28 h-28 mb-6 text-white p-6 rounded-full bg-gradient-to-br ${card.color} shadow-[0_0_20px_rgba(255,255,255,0.2)] transform hover:scale-110 transition-transform duration-500`}>
          {card.icon}
        </div>
        
        <h3 className={`text-3xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r ${card.color} tracking-tighter`}>{card.label}</h3>
        
        <div className="bg-white/5 rounded-2xl p-6 border border-white/5 w-full flex-grow flex items-center">
             <p className="text-xl text-gray-100 font-serif italic leading-relaxed drop-shadow-sm">
                "{prediction}"
             </p>
        </div>
        
        <p className="text-cyan-400/60 mt-8 font-bold uppercase tracking-[0.2em] text-[10px]">{translations.comeBackTomorrow}</p>
      </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-4 px-2">
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-black text-glow bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-cyan-100 to-purple-200 mb-4 animate-gradient-x">
            {translations.cardsTitle}
        </h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
            {canPickToday ? translations.pickACard : translations.comeBackTomorrow}
        </p>
      </div>
      
      {!canPickToday && lastPickedCard ? (
         renderActiveResult(getCardByType(lastPickedCard.type))
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-8 [perspective:2000px] w-full justify-items-center">
          {cardTypes.map((card, index) => (
            <div key={card.type}
                 onClick={() => handleCardPick(card.type)}
                 className={`relative w-full aspect-[2/3] max-w-[220px] rounded-2xl md:rounded-[2rem] cursor-pointer transition-all duration-700 [transform-style:preserve-3d] group
                   ${canPickToday && !chosenCard ? "hover:-translate-y-4 hover:shadow-[0_20px_50px_rgba(0,0,0,0.6)]" : ""}
                   ${chosenCard === card.type ? '[transform:rotateY(180deg)] z-50 scale-110' : ''}
                   ${chosenCard && chosenCard !== card.type ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100'}`}
                 style={{ transitionDelay: `${index * 40}ms` }}
            >
                {/* Card Back (Sirli tomon) */}
                <div className="absolute w-full h-full bg-[#0d0d1a] rounded-2xl md:rounded-[2rem] [backface-visibility:hidden] flex items-center justify-center flex-col shadow-2xl border border-white/5 overflow-hidden">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                     <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-black/40"></div>
                     
                     {/* Frame */}
                     <div className="absolute inset-3 border border-white/10 rounded-xl md:rounded-[1.5rem]"></div>
                     
                     <div className="relative z-10 text-5xl md:text-7xl group-hover:scale-125 transition-transform duration-700 filter drop-shadow-[0_0_15px_rgba(167,139,250,0.6)] group-hover:rotate-12">
                        ✨
                     </div>
                </div>

                {/* Card Front (Ochilgan tomon) */}
                <div className={`absolute w-full h-full bg-gray-900 rounded-2xl md:rounded-[2rem] [backface-visibility:hidden] [transform:rotateY(180deg)] p-6 flex flex-col items-center justify-between text-center border-2 border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden`}>
                    <div className={`absolute inset-0 bg-gradient-to-b ${card.color} opacity-20`}></div>
                    
                    <div className="relative z-10 pt-4">
                        <div className={`w-16 h-16 mx-auto mb-4 text-white p-4 rounded-full bg-gradient-to-br ${card.color} shadow-lg`}>
                            {card.icon}
                        </div>
                        <h3 className="text-xl font-black text-white drop-shadow-md">{card.label}</h3>
                    </div>
                    
                    <div className="relative z-10 flex-grow flex items-center justify-center mt-4">
                        {isLoading && chosenCard === card.type ? (
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></span>
                                <span className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        ) : (
                            prediction && chosenCard === card.type && (
                                <p className="text-xs md:text-sm italic text-gray-200 animate-fade-in line-clamp-6 leading-relaxed">
                                    "{prediction}"
                                </p>
                            )
                        )}
                    </div>
                </div>
            </div>
          ))}
        </div>
      )}
      
      {error && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-red-900/80 backdrop-blur-md border border-red-500 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce z-50">
              {error}
          </div>
      )}
    </div>
  );
};

export default DreamCards;
