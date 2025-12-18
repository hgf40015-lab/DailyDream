import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { AnalysisMethodsIcon, PsychologyIcon } from './icons/Icons';
import { EncyclopediaIcon } from './icons/Icons'; // Re-using as it fits the theme

const AnalysisMethods: React.FC = () => {
    const { translations } = useContext(LanguageContext);

    return (
        <div className="max-w-4xl mx-auto">
             <div className="text-center mb-10">
                <div className="w-16 h-16 mx-auto text-cyan-300 mb-4">
                    <AnalysisMethodsIcon />
                </div>
                <h2 className="text-3xl font-bold text-glow">{translations.analysisMethodsTitle}</h2>
                <p className="text-gray-300">{translations.analysisMethodsSubtitle}</p>
            </div>

            <div className="space-y-8">
                <div className="bg-gray-800/50 p-6 rounded-lg border border-purple-400/20 animate-fade-in-up">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 text-cyan-300 flex-shrink-0">
                            <PsychologyIcon />
                        </div>
                        <h3 className="text-2xl font-bold text-cyan-200">{translations.psychological}</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{translations.psychologicalIntro}</p>
                </div>
                 <div className="bg-gray-800/50 p-6 rounded-lg border border-purple-400/20 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 text-green-300 flex-shrink-0">
                             <EncyclopediaIcon />
                        </div>
                        <h3 className="text-2xl font-bold text-green-200">{translations.islamic}</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{translations.islamicIntro}</p>
                </div>
            </div>
        </div>
    );
};

export default AnalysisMethods;
