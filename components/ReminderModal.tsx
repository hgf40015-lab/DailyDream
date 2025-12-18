import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { DreamIcon } from './icons/Icons';

interface ReminderModalProps {
  onClose: () => void;
  onWrite: () => void;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ onClose, onWrite }) => {
  const { translations } = useContext(LanguageContext);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 border border-purple-400/30 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-[50px] -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-[50px] -ml-10 -mb-10"></div>
        
        <div className="relative z-10">
            <div className="w-20 h-20 mx-auto text-cyan-200 mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)] animate-pulse-slow">
                <DreamIcon />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-white">{translations.reminderTitle}</h2>
            <p className="text-gray-300 mb-8 leading-relaxed">{translations.reminderMessage}</p>
            
            <div className="flex flex-col gap-3">
                <button
                onClick={onWrite}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/30 transform hover:scale-[1.02] transition-all"
                >
                {translations.writeNow}
                </button>
                <button
                onClick={onClose}
                className="w-full py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-colors"
                >
                {translations.maybeLater}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;