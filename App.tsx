
import React, { useState, useContext, useEffect } from 'react';
import StarryBackground from './components/StarryBackground';
import LanguageSelector from './components/LanguageSelector';
import Sidebar from './components/Sidebar';
import HomePage from './components/HomePage';
import DreamJourney from './components/DreamJourney';
import DreamDiary from './components/DreamDiary';
import DreamDictionary from './components/DreamDictionary';
import DreamCards from './components/DreamCards';
import DreamProfile from './components/Profile';
import Settings from './components/Settings';
import PremiumTherapist from './components/PremiumTherapist';
import DreamMachine from './components/DreamMachine';
import Meditation from './components/Meditation';
import Challenges from './components/Challenges';
import DreamCoach from './components/DreamCoach';
import PublicDreams from './components/PublicDreams';
import VisualizeDream from './components/VisualizeDream';
import DreamGallery from './components/DreamGallery';
import NamePrompt from './components/NamePrompt';
import BirthdayModal from './components/BirthdayModal';
import ReminderModal from './components/ReminderModal';
import Blog from './components/Blog';
import Footer from './components/Footer';
import { View, Theme } from './types';
import { LanguageContext } from './contexts/LanguageContext';

const App: React.FC = () => {
  const { language, setLanguage } = useContext(LanguageContext);
  const [currentView, setCurrentView] = useState<View>('home');
  const [isLanguageSelectorOpen, setLanguageSelectorOpen] = useState(false);
  
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [userBirthDate, setUserBirthDate] = useState<string | null>(null);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [theme, setThemeState] = useState<Theme>('default');
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');
  
  const [backgroundMoodClass, setBackgroundMoodClass] = useState('bg-mood-neutral');

  useEffect(() => {
    if (!language) {
      setLanguageSelectorOpen(true);
    } else {
      setLanguageSelectorOpen(false);
    }
  }, [language]);

  useEffect(() => {
    if (language) {
      const savedName = localStorage.getItem('dream-app-user-fullname');
      const savedBirthDate = localStorage.getItem('dream-app-user-birthdate');
      const savedTheme = localStorage.getItem('dream-app-theme') as Theme;
      
      if (savedName && savedBirthDate) {
        setUserFullName(savedName);
        setUserBirthDate(savedBirthDate);
      } else {
        setShowNamePrompt(true);
      }
      if (savedTheme) {
          setThemeState(savedTheme);
      }

      // Check for daily reminder
      const lastLog = localStorage.getItem('last-dream-log-date');
      const today = new Date().toDateString();
      if (lastLog !== today) {
          // Add a small delay so it doesn't pop up instantly over name prompt
          setTimeout(() => {
              if (savedName) setShowReminderModal(true);
          }, 2000);
      }
    }
  }, [language]);

  const handleSetTheme = (newTheme: Theme) => {
      setThemeState(newTheme);
      localStorage.setItem('dream-app-theme', newTheme);
  };

  useEffect(() => {
    if (userBirthDate) {
      const today = new Date();
      const birthDate = new Date(userBirthDate);
      if (today.getMonth() === birthDate.getMonth() && today.getDate() === birthDate.getDate()) {
        const lastShown = localStorage.getItem('birthday-modal-last-shown');
        if (lastShown !== today.getFullYear().toString()) {
          setShowBirthdayModal(true);
          localStorage.setItem('birthday-modal-last-shown', today.getFullYear().toString());
        }
      }
    }
  }, [userBirthDate]);

  const handleSaveUserInfo = (fullName: string, birthDate: string) => {
    localStorage.setItem('dream-app-user-fullname', fullName);
    localStorage.setItem('dream-app-user-birthdate', birthDate);
    setUserFullName(fullName);
    setUserBirthDate(birthDate);
    setShowNamePrompt(false);
  };

  const handleWriteNow = () => {
      setShowReminderModal(false);
      setCurrentView('dreamJourney');
      // Mark as shown for today even if they don't finish, to avoid annoyance
      localStorage.setItem('last-dream-log-date', new Date().toDateString()); 
  }
  
  // Handle global search redirection
  const handleGlobalSearch = (term: string) => {
      setGlobalSearchTerm(term);
      setCurrentView('encyclopedia');
  };
  
  // Dynamic CSS injection for themes
  const getThemeStyles = () => {
      switch(theme) {
          case 'nature':
              return `
                .text-cyan-300 { color: #86efac !important; } /* green-300 */
                .text-cyan-400 { color: #4ade80 !important; } /* green-400 */
                .text-cyan-200 { color: #bbf7d0 !important; } /* green-200 */
                .text-purple-300 { color: #fde047 !important; } /* yellow-300 */
                .text-purple-200 { color: #fef08a !important; } /* yellow-200 */
                .text-purple-400 { color: #facc15 !important; } /* yellow-400 */
                .bg-purple-600 { background-color: #15803d !important; } /* green-700 */
                .border-purple-400 { border-color: #16a34a !important; } /* green-600 */
                .from-purple-600 { --tw-gradient-from: #15803d !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
                .to-cyan-500 { --tw-gradient-to: #eab308 !important; } /* yellow-500 */
                .shadow-purple-500\\/30 { --tw-shadow-color: rgba(22, 163, 74, 0.3) !important; }
              `;
          case 'ocean':
              return `
                .text-purple-300 { color: #7dd3fc !important; } /* sky-300 */
                .text-purple-200 { color: #bae6fd !important; } /* sky-200 */
                .bg-purple-600 { background-color: #0369a1 !important; } /* sky-700 */
                .border-purple-400 { border-color: #0ea5e9 !important; } /* sky-500 */
                .from-purple-600 { --tw-gradient-from: #0284c7 !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
                .to-cyan-500 { --tw-gradient-to: #2dd4bf !important; } /* teal-400 */
                .shadow-purple-500\\/30 { --tw-shadow-color: rgba(2, 132, 199, 0.3) !important; }
              `;
          case 'sunset':
              return `
                .text-cyan-300 { color: #fdba74 !important; } /* orange-300 */
                .text-cyan-400 { color: #fb923c !important; } /* orange-400 */
                .text-purple-300 { color: #fca5a5 !important; } /* red-300 */
                .text-purple-200 { color: #fecaca !important; } /* red-200 */
                .bg-purple-600 { background-color: #b91c1c !important; } /* red-700 */
                .border-purple-400 { border-color: #ef4444 !important; } /* red-500 */
                .from-purple-600 { --tw-gradient-from: #dc2626 !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
                .to-cyan-500 { --tw-gradient-to: #f97316 !important; } /* orange-500 */
                .shadow-purple-500\\/30 { --tw-shadow-color: rgba(220, 38, 38, 0.3) !important; }
              `;
          case 'royal':
              return `
                .text-cyan-300 { color: #fcd34d !important; } /* amber-300 */
                .text-purple-300 { color: #e2e8f0 !important; } /* slate-200 */
                .bg-purple-600 { background-color: #ca8a04 !important; } /* yellow-600 */
                .border-purple-400 { border-color: #fbbf24 !important; } /* amber-400 */
                .from-purple-600 { --tw-gradient-from: #b45309 !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
                .to-cyan-500 { --tw-gradient-to: #cbd5e1 !important; } /* slate-300 */
                .shadow-purple-500\\/30 { --tw-shadow-color: rgba(202, 138, 4, 0.3) !important; }
              `;
          case 'monochrome':
              return `
                .text-cyan-300 { color: #d1d5db !important; } /* gray-300 */
                .text-cyan-400 { color: #9ca3af !important; } /* gray-400 */
                .text-purple-300 { color: #e5e7eb !important; } /* gray-200 */
                .bg-purple-600 { background-color: #374151 !important; } /* gray-700 */
                .border-purple-400 { border-color: #6b7280 !important; } /* gray-500 */
                .from-purple-600 { --tw-gradient-from: #1f2937 !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
                .to-cyan-500 { --tw-gradient-to: #9ca3af !important; } /* gray-400 */
                .shadow-purple-500\\/30 { --tw-shadow-color: rgba(255, 255, 255, 0.1) !important; }
              `;
          default:
              return '';
      }
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage setCurrentView={setCurrentView} userFullName={userFullName} onSearch={handleGlobalSearch} />;
      case 'dreamJourney':
        return <DreamJourney setBackgroundMoodClass={setBackgroundMoodClass} />;
      case 'encyclopedia':
        return <DreamDictionary initialSearchTerm={globalSearchTerm} />;
      case 'cards':
        return <DreamCards />;
      case 'dreamProfile':
        return <DreamProfile />;
      case 'settings':
        return <Settings onSave={handleSaveUserInfo} currentTheme={theme} setTheme={handleSetTheme} />;
      case 'premium':
        return <PremiumTherapist />;
      case 'dreamMachine':
        return <DreamMachine />;
      case 'meditation':
        return <Meditation />;
      case 'challenges':
        return <Challenges />;
      case 'dreamCoach':
        return <DreamCoach />;
      case 'publicDreams':
        return <PublicDreams />;
      case 'visualizeDream':
        return <VisualizeDream />;
      case 'dreamGallery': 
        return <DreamGallery />;
      case 'blog':
        return <Blog />;
      default:
        return <HomePage setCurrentView={setCurrentView} userFullName={userFullName} onSearch={handleGlobalSearch} />;
    }
  };

  return (
    <div className={`min-h-screen font-sans text-white transition-colors duration-1000 ${backgroundMoodClass} overflow-x-hidden`}>
      <style>{getThemeStyles()}</style>
      <StarryBackground />
      {isLanguageSelectorOpen && <LanguageSelector onClose={() => setLanguageSelectorOpen(false)} />}
      {showNamePrompt && !isLanguageSelectorOpen && <NamePrompt onSave={handleSaveUserInfo} />}
      {showBirthdayModal && <BirthdayModal onClose={() => setShowBirthdayModal(false)} userName={userFullName} />}
      {showReminderModal && !showNamePrompt && !isLanguageSelectorOpen && <ReminderModal onClose={() => setShowReminderModal(false)} onWrite={handleWriteNow} />}
      
      <div className="flex flex-col md:flex-row min-h-screen">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} openLanguageSelector={() => setLanguageSelectorOpen(true)} />
        {/* Main Content Area: Responsive Padding and Layout */}
        <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto pb-24 md:pb-8 w-full max-w-[100vw]">
          <div className="flex-grow w-full">
            {renderView()}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default App;
