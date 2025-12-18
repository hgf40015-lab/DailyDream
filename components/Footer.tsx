import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

const Footer: React.FC = () => {
    const { translations } = useContext(LanguageContext);
    return (
        <footer className="w-full text-center p-4 mt-auto">
            <p className="text-sm text-gray-500">{translations.footer}</p>
        </footer>
    );
}

export default Footer;
