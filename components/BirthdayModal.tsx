import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { CakeIcon } from './icons/Icons';

interface BirthdayModalProps {
  onClose: () => void;
  userName: string | null;
}

const BirthdayModal: React.FC<BirthdayModalProps> = ({ onClose, userName }) => {
  const { translations } = useContext(LanguageContext);

  const title = userName 
    ? translations.birthdayTitle.replace('{name}', userName) 
    : "Happy Birthday!";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gray-900 border-2 border-yellow-400 rounded-2xl p-8 shadow-2xl shadow-yellow-500/20 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto text-yellow-300 mb-4 animate-pulse">
            <CakeIcon />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-yellow-300 text-glow">{title}</h2>
        <p className="text-gray-300 mb-6">{translations.birthdayMessage}</p>
        <button
          onClick={onClose}
          className="mt-4 px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-full transform hover:scale-105 transition-transform"
        >
          {translations.close}
        </button>
      </div>
    </div>
  );
};

export default BirthdayModal;
