
import React, { useState, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import DreamInterpreter from './DreamInterpreter';
import DreamTest from './DreamTest';
import WakingExperience from './WakingExperience';
import { WakingExperienceIcon, DreamIcon, DreamTestIcon } from './icons/Icons';

type JourneyStep = 'waking' | 'interpret' | 'test';

interface DreamJourneyProps {
  setBackgroundMoodClass: (className: string) => void;
}

const DreamJourney: React.FC<DreamJourneyProps> = ({ setBackgroundMoodClass }) => {
  const { translations } = useContext(LanguageContext);
  const [step, setStep] = useState<JourneyStep>('waking');

  const tabs = [
    { id: 'waking', label: translations.wakingExperience, icon: <WakingExperienceIcon /> },
    { id: 'interpret', label: translations.dreamInterpreter, icon: <DreamIcon /> },
    { id: 'test', label: translations.dreamTest, icon: <DreamTestIcon /> },
  ];

  const renderContent = () => {
    switch (step) {
      case 'waking':
        return <WakingExperience onComplete={() => setStep('interpret')} />;
      case 'interpret':
        return <DreamInterpreter setCurrentView={() => {}} setBackgroundMoodClass={setBackgroundMoodClass} />;
      case 'test':
        return <DreamTest />;
      default:
        return <WakingExperience onComplete={() => setStep('interpret')} />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 mb-8 mt-2">
        <div className="flex justify-center">
            <div className="inline-flex bg-gray-900/80 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-lg">
              {tabs.map((tab) => {
                const isActive = step === tab.id;
                return (
                    <button
                    key={tab.id}
                    onClick={() => setStep(tab.id as JourneyStep)}
                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-500 ${
                        isActive
                        ? 'text-white shadow-md'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                    >
                    {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full -z-10 animate-fade-in"></div>
                    )}
                    <span className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`}>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                )
              })}
            </div>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto custom-scrollbar px-1">
        {renderContent()}
      </div>
    </div>
  );
};

export default DreamJourney;
