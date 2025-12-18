
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
}

// Pseudo-random generator seeded by date string
const seededRandom = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    const x = Math.sin(hash) * 10000;
    return x - Math.floor(x);
};

const shuffleArray = <T,>(array: T[], seed: string): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(seed + i) * (i + 1));
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
  const [canPick, setCanPick] = useState(false);
  const [lastPickedCard, setLastPickedCard] = useState<LastPickedCard | null>(null);

  useEffect(() => {
    const lastPickTime = localStorage.getItem('last-card-pick-time');
    const lastCardDataRaw = localStorage.getItem('last-picked-card-data');

    if (lastPickTime && lastCardDataRaw) {
      const timeDiff = new Date().getTime() - parseInt(lastPickTime, 10);
      // Check if it's a new day (simple 24h check for now, or use date string comparison)
      if (timeDiff < 24 * 60 * 60 * 1000) {
        setCanPick(false);
        setLastPickedCard(JSON.parse(lastCardDataRaw));
      } else {
        setCanPick(true);
        localStorage.removeItem('last-card-pick-time');
        localStorage.removeItem('last-picked-card-data');
      }
    } else {
      setCanPick(true);
    }
  }, []);

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

  // Shuffle cards based on today's date so they change every day
  const cardTypes = useMemo(() => {
      const today = new Date().toISOString().split('T')[0];
      return shuffleArray(rawCardTypes, today);
  }, [translations]); // Re-shuffle if translations change (language switch)

  const handleCardPick = async (cardType: CardType) => {
    if (!canPick || isLoading || !language || chosenCard) return;

    setIsLoading(true);
    setError(null);
    setPrediction(null);
    setChosenCard(cardType);
    
    try {
      const result = await getCardPrediction(cardType, language);
      setPrediction(result.prediction);
      const cardDataToSave = { type: cardType, prediction: result.prediction };
      localStorage.setItem('last-card-pick-time', new Date().getTime().toString());
      localStorage.setItem('last-picked-card-data', JSON.stringify(cardDataToSave));
      
      setTimeout(() => {
        setCanPick(false);
        setLastPickedCard(cardDataToSave);
      }, 2000); // Delay to allow animation and reading

    } catch (e) {
      setError(translations.error);
      setTimeout(() => {
        setChosenCard(null); // Allow picking again on error
        setError(null);
      }, 2000);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getCardByType = (type: CardType) => rawCardTypes.find(c => c.type === type)!;

  const renderSingleCard = (card: CardData) => (
      <div className="w-full max-w-sm mx-auto h-[28rem] bg-gray-900 rounded-3xl border-2 border-cyan-400/50 shadow-[0_0_50px_rgba(34,211,238,0.2)] flex flex-col items-center justify-center text-center animate-fade-in-up relative overflow-hidden">
        {/* Background glow */}
        <div className={`absolute inset-0 bg-gradient-to-b ${card.color} opacity-10`}></div>
        
        <div className={`w-28 h-28 mb-6 text-white p-5 rounded-full bg-gradient-to-br ${card.color} shadow-lg`}>
          {card.icon}
        </div>
        <h3 className={`text-3xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r ${card.color}`}>{card.label}</h3>
        <div className="px-6 flex-grow flex items-center">
             <p className="text-lg md:text-xl text-gray-100 font-serif italic leading-relaxed">"{lastPickedCard?.prediction}"</p>
        </div>
        <p className="text-cyan-400/70 mt-6 font-bold uppercase tracking-widest text-xs mb-6">{translations.comeBackTomorrow}</p>
      </div>
  );

  return (
    <div className="max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[70vh] p-2 md:p-4">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-glow bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-cyan-200 mb-2">{translations.cardsTitle}</h2>
        <p className="text-gray-400 text-base md:text-lg">
            {canPick && !chosenCard ? translations.pickACard : translations.cardsSubtitle}
        </p>
      </div>
      
      {!canPick && lastPickedCard ? (
         renderSingleCard(getCardByType(lastPickedCard.type))
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 [perspective:1000px] w-full justify-items-center">
          {cardTypes.map((card, index) => (
            <div key={card.type}
                 onClick={() => handleCardPick(card.type)}
                 className={`relative w-full aspect-[2/3] max-w-[160px] sm:max-w-[180px] md:max-w-[200px] rounded-xl md:rounded-2xl cursor-pointer transition-all duration-700 [transform-style:preserve-3d] group
                   ${canPick && !chosenCard ? "hover:-translate-y-4 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]" : ""}
                   ${chosenCard === card.type ? '[transform:rotateY(180deg)] z-50 scale-110' : ''}
                   ${chosenCard && chosenCard !== card.type ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100'}`}
                 style={{ transitionDelay: `${index * 50}ms` }}
            >
                {/* Card Back */}
                <div className="absolute w-full h-full bg-[#1a1a2e] rounded-xl md:rounded-2xl [backface-visibility:hidden] flex items-center justify-center flex-col shadow-xl border border-white/10 overflow-hidden">
                     {/* Mystic Pattern Background */}
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                     <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-blue-900/40"></div>
                     <div className="absolute inset-2 border border-white/10 rounded-lg"></div>
                     
                     <div className="relative z-10 text-4xl sm:text-5xl md:text-7xl text-purple-200 opacity-80 group-hover:scale-110 transition-transform duration-500 filter drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">✨</div>
                </div>

                {/* Card Front */}
                <div className={`absolute w-full h-full bg-gray-900 rounded-xl md:rounded-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] p-2 md:p-4 flex flex-col items-center justify-between text-center border-2 border-white/10 shadow-2xl overflow-hidden`}>
                    <div className={`absolute inset-0 bg-gradient-to-b ${card.color} opacity-20`}></div>
                    
                    <div className="relative z-10 pt-2 md:pt-4">
                        <div className={`w-10 h-10 md:w-14 md:h-14 mx-auto mb-2 text-white p-2 md:p-3 rounded-full bg-gradient-to-br ${card.color} shadow-lg`}>
                            {card.icon}
                        </div>
                        <h3 className="text-sm md:text-lg font-bold text-white">{card.label}</h3>
                    </div>
                    
                    <div className="relative z-10 flex-grow flex items-center justify-center">
                        {isLoading && chosenCard === card.type ? (
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '100ms' }}></span>
                                <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></span>
                            </div>
                        ) : (
                            <div className="w-full h-1 bg-white/20 rounded-full my-2"></div>
                        )}
                        {prediction && chosenCard === card.type && <p className="text-xs md:text-sm italic text-gray-200 animate-fade-in line-clamp-4">"{prediction}"</p>}
                    </div>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DreamCards;
