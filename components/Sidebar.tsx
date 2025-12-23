
import React, { useContext, useState } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { View } from '../types';
import { 
    LanguageIcon, HomeIcon, EncyclopediaIcon, CardsIcon, SettingsIcon, 
    DreamMachineIcon, DreamProfileIcon, 
    DreamCoachIcon, PublicDreamsIcon, VisualizeDreamIcon, PremiumIcon, 
    JourneyIcon, MenuIcon, XMarkIcon
} from './icons/Icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  openLanguageSelector: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, openLanguageSelector }) => {
  const { translations } = useContext(LanguageContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Grouped Categories for clearer navigation
  const categories = [
    {
        title: translations.catDiscover,
        items: [
            { id: 'home', label: translations.home, icon: <HomeIcon /> },
            { id: 'publicDreams', label: translations.publicDreams, icon: <PublicDreamsIcon /> },
            { id: 'encyclopedia', label: translations.dreamEncyclopedia, icon: <EncyclopediaIcon /> },
        ]
    },
    {
        title: translations.catMyWorld,
        items: [
            { id: 'dreamJourney', label: translations.dreamJourney, icon: <JourneyIcon /> },
            { id: 'dreamProfile', label: translations.dreamProfile, icon: <DreamProfileIcon /> },
            { id: 'cards', label: translations.dreamCards, icon: <CardsIcon /> },
        ]
    },
    {
        title: translations.catCreate,
        items: [
            { id: 'visualizeDream', label: translations.visualizeDream, icon: <VisualizeDreamIcon /> },
            { id: 'dreamMachine', label: translations.dreamMachine, icon: <DreamMachineIcon /> },
        ]
    },
    {
        title: translations.catInsight,
        items: [
            { id: 'dreamCoach', label: translations.dreamCoach, icon: <DreamCoachIcon /> },
        ]
    },
    {
        title: translations.catWellbeing,
        items: [
            { id: 'premium', label: translations.premiumFeatures, icon: <PremiumIcon /> },
        ]
    },
    {
        title: translations.catSystem,
        items: [
            { id: 'settings', label: translations.settings, icon: <SettingsIcon /> },
        ]
    }
  ];

  const handleMobileNav = (view: View) => {
      setCurrentView(view);
      setIsMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const MobileBottomNav = () => (
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[80px] bg-black/80 backdrop-blur-xl border-t border-white/5 flex justify-around items-end px-2 z-40 pb-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          {[
              { id: 'home', label: translations.home, icon: <HomeIcon /> },
              { id: 'dreamJourney', label: translations.dreamJourney, icon: <JourneyIcon /> },
              { id: 'visualizeDream', label: '', icon: <VisualizeDreamIcon />, isFab: true },
              { id: 'dreamProfile', label: translations.dreamProfile, icon: <DreamProfileIcon /> },
              { id: 'menu', label: 'Menu', icon: <MenuIcon />, action: () => setIsMobileMenuOpen(true) },
          ].map((item, idx) => {
              const isActive = currentView === item.id;
              
              if (item.isFab) {
                  return (
                    <button 
                        key={idx}
                        onClick={() => handleMobileNav(item.id as View)} 
                        className={`relative mb-6 -top-2 flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 shadow-[0_0_20px_rgba(139,92,246,0.5)] border-4 border-black transition-transform duration-300 active:scale-90 ${isActive ? 'scale-110 shadow-[0_0_30px_rgba(34,211,238,0.6)]' : ''}`}
                    >
                        <div className="w-6 h-6 text-white">{item.icon}</div>
                    </button>
                  )
              }

              return (
                <button 
                    key={idx}
                    onClick={item.action || (() => handleMobileNav(item.id as View))} 
                    className={`relative flex flex-col items-center gap-1 p-2 w-16 transition-all duration-300 group ${isActive ? 'text-cyan-400 -translate-y-1' : 'text-gray-500'}`}
                >
                    <div className={`w-6 h-6 transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                        {item.icon}
                    </div>
                    <span className="text-[10px] font-medium tracking-wide truncate max-w-full">{item.label}</span>
                    {isActive && <div className="absolute -bottom-2 w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_5px_cyan]"></div>}
                </button>
              )
          })}
      </div>
  );

  const MobileMenuDrawer = () => (
      <div className={`fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) transform ${isMobileMenuOpen ? 'translate-y-0' : 'translate-y-full'} md:hidden flex flex-col`}>
          <div className="flex justify-between items-center p-6 border-b border-white/5 bg-gradient-to-b from-gray-900 to-transparent">
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 tracking-wider">DAILY DREAM</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="w-10 h-10 text-white bg-white/10 rounded-full p-2.5 hover:bg-white/20 transition-colors">
                  <XMarkIcon />
              </button>
          </div>
          
          <div className="flex-grow overflow-y-auto p-6 pb-24 custom-scrollbar">
              {categories.map((cat, idx) => (
                  <div key={idx} className="mb-8 animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 ml-2 border-l-2 border-purple-500/30 pl-2">{cat.title}</h3>
                      <div className="grid grid-cols-2 gap-3">
                          {cat.items.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => handleMobileNav(item.id as View)}
                                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                                    currentView === item.id 
                                    ? 'bg-white/10 border-cyan-500/50 text-white shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                                    : 'bg-gray-900/50 border-white/5 text-gray-400 hover:bg-gray-800 hover:border-white/10'
                                }`}
                              >
                                  <div className={`w-5 h-5 ${currentView === item.id ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]' : 'text-gray-500'}`}>{item.icon}</div>
                                  <span className="text-sm font-medium">{item.label}</span>
                              </button>
                          ))}
                      </div>
                  </div>
              ))}
              
              <button
                onClick={() => { openLanguageSelector(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 p-4 mt-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl text-gray-300 border border-white/10 hover:border-white/30 transition-all"
              >
                <div className="w-5 h-5"><LanguageIcon /></div>
                <span>{translations.selectLanguage}</span>
              </button>
          </div>
      </div>
  );

  return (
    <>
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 bg-black/40 backdrop-blur-2xl border-r border-white/5 overflow-hidden shadow-[5px_0_30px_rgba(0,0,0,0.5)] z-50">
            <div className="p-8 border-b border-white/5 bg-gradient-to-b from-purple-900/10 to-transparent">
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-cyan-300 tracking-tighter drop-shadow-sm">
                    DAILY DREAM
                </h1>
                <p className="text-[10px] text-gray-500 tracking-widest mt-1 uppercase">AI Dream Analysis</p>
            </div>

            <nav className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-8">
                {categories.map((cat, idx) => (
                    <div key={idx}>
                        <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-3 ml-4">{cat.title}</h3>
                        <div className="space-y-1">
                            {cat.items.map(item => {
                                const isActive = currentView === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setCurrentView(item.id as View)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${
                                            isActive
                                            ? 'text-white bg-white/5 shadow-inner'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        {/* Active Indicator Bar */}
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-r-full shadow-[0_0_10px_cyan]"></div>
                                        )}
                                        
                                        <span className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-cyan-300 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                            {item.icon}
                                        </span>
                                        <span className="relative z-10">{item.label}</span>
                                        
                                        {/* Hover Glow */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-white/5 bg-black/20">
                <button
                    onClick={openLanguageSelector}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                >
                    <div className="w-5 h-5"><LanguageIcon /></div>
                    <span>{translations.selectLanguage}</span>
                </button>
            </div>
        </aside>

        {/* Mobile Navigation */}
        <MobileBottomNav />
        <MobileMenuDrawer />
    </>
  );
};

export default Sidebar;
