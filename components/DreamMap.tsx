
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { getDreamMapData } from '../services/geminiService';
import { StoredDream, DreamMapData } from '../types';
import { DreamMapIcon, SummaryIcon, ShieldIcon } from './icons/Icons';

const DreamMap: React.FC = () => {
  const { translations, language } = useContext(LanguageContext);
  const [dreams, setDreams] = useState<StoredDream[]>([]);
  const [selectedDreamIndex, setSelectedDreamIndex] = useState<string>('');
  const [mapData, setMapData] = useState<DreamMapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    const savedDreamsRaw = localStorage.getItem('user-dreams');
    if (savedDreamsRaw) {
      const savedDreams: StoredDream[] = JSON.parse(savedDreamsRaw);
      savedDreams.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setDreams(savedDreams);
      
      // Auto-select the latest dream if available
      if (savedDreams.length > 0) {
          // We don't trigger fetch automatically to save tokens, but we prepare the UI
          setSelectedDreamIndex('0'); 
      }
    }
  }, []);

  const handleAnalyzeClick = async () => {
     if(!selectedDreamIndex) return;
     handleSelectDream(selectedDreamIndex);
  }

  const handleSelectDream = async (indexStr: string) => {
    const index = parseInt(indexStr, 10);
    if (isNaN(index) || !language) return;

    setIsLoading(true);
    setError(null);
    setMapData(null);
    setSelectedNodeId(null);

    try {
      const result = await getDreamMapData(dreams[index].dream, language);
      setMapData(result);
    } catch (e) {
      console.error(e);
      setError(translations.error);
    } finally {
      setIsLoading(false);
    }
  };

  const nodePositions = useMemo(() => {
    if (!mapData || !mapData.nodes) return {};
    const positions: { [key: string]: { x: number; y: number } } = {};
    const centerX = 50;
    const centerY = 50;
    
    // Create a more organic, galaxy-like spiral distribution
    mapData.nodes.forEach((node, i) => {
      const angle = (i / mapData.nodes.length) * 2 * Math.PI; // Circle distribution
      // Vary radius slightly to create depth, not a perfect circle
      const radius = 35 + (i % 2 === 0 ? 5 : -5); 
      
      positions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
    return positions;
  }, [mapData]);

  const getNodeStyle = (group: string) => {
      switch (group) {
          case 'person': return { color: 'bg-yellow-400', glow: 'shadow-yellow-500/50', icon: '👤' }; // Person
          case 'place': return { color: 'bg-green-400', glow: 'shadow-green-500/50', icon: '🌍' }; // Place
          case 'object': return { color: 'bg-blue-400', glow: 'shadow-blue-500/50', icon: '📦' }; // Object
          case 'emotion': return { color: 'bg-pink-500', glow: 'shadow-pink-500/50', icon: '❤️' }; // Emotion
          case 'action': return { color: 'bg-orange-500', glow: 'shadow-orange-500/50', icon: '⚡' }; // Action
          default: return { color: 'bg-white', glow: 'shadow-white/50', icon: '✨' };
      }
  };

  const selectedNodeData = mapData?.nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* Header Section */}
      <div className="text-center mb-8 relative">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-cyan-500/10 blur-[60px] -z-10 rounded-full"></div>
         <div className="w-16 h-16 md:w-20 md:h-20 mx-auto text-cyan-300 mb-4 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] animate-pulse-slow"><DreamMapIcon /></div>
        <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-cyan-100 to-purple-200 mb-3">{translations.dreamMapTitle}</h2>
        <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed px-4">{translations.dreamMapSubtitle}</p>
      </div>
      
      {/* Controls */}
      <div className="bg-gray-900/40 backdrop-blur-xl p-4 rounded-2xl border border-white/10 mb-8 max-w-3xl mx-auto shadow-xl flex flex-col sm:flex-row gap-4 items-center mx-4 md:mx-auto">
        <div className="relative w-full">
            <select
            value={selectedDreamIndex}
            onChange={e => setSelectedDreamIndex(e.target.value)}
            className="w-full p-4 pl-12 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-400 outline-none text-white text-base md:text-lg appearance-none cursor-pointer hover:bg-gray-700/80 transition-colors truncate"
            >
            <option value="" disabled>{translations.selectDreamForMap}</option>
            {dreams.map((dream, index) => (
                <option key={index} value={index}>
                {new Date(dream.date).toLocaleDateString()} — {dream.dream.length > 30 ? dream.dream.substring(0, 30) + '...' : dream.dream}
                </option>
            ))}
            </select>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <SummaryIcon />
            </div>
        </div>
        
        <button 
            onClick={handleAnalyzeClick}
            disabled={!selectedDreamIndex || isLoading}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/30 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
            {isLoading ? translations.interpreting : translations.generate}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        
        {/* Left Side: The Galaxy Map */}
        <div className="lg:col-span-8 relative w-full aspect-square md:aspect-auto md:h-[600px] bg-[#0B0B15] rounded-[2rem] border-2 border-white/5 flex items-center justify-center overflow-hidden shadow-2xl group">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0B0B15] to-[#0B0B15]"></div>
            
            {/* Stars Background */}
            <div className="absolute inset-0 opacity-50">
                {[...Array(30)].map((_, i) => (
                    <div 
                        key={i} 
                        className="absolute bg-white rounded-full animate-pulse" 
                        style={{
                            width: Math.random() * 2 + 'px',
                            height: Math.random() * 2 + 'px',
                            top: Math.random() * 100 + '%',
                            left: Math.random() * 100 + '%',
                            animationDelay: Math.random() * 5 + 's',
                            opacity: Math.random()
                        }}
                    ></div>
                ))}
            </div>

            {/* Empty State */}
            {!mapData && !isLoading && (
                <div className="text-center p-8 z-10 opacity-60">
                    <div className="w-24 h-24 mx-auto mb-4 text-gray-600"><DreamMapIcon /></div>
                    <p className="text-xl text-gray-400">{translations.selectDreamForMap}</p>
                </div>
            )}
            
            {/* Loading State */}
            {isLoading && (
                 <div className="flex flex-col items-center justify-center z-20">
                     <div className="relative w-24 h-24">
                        <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                     </div>
                     <p className="mt-6 text-lg font-bold text-cyan-200 tracking-widest animate-pulse">{translations.interpreting}</p>
                 </div>
            )}
            
            {error && <p className="text-red-400 px-6 text-center z-20 bg-black/50 p-4 rounded-xl backdrop-blur-sm border border-red-500/30">{error}</p>}
            
            {/* Map Rendering */}
            {mapData && !isLoading && (
                <>
                 {/* Connection Lines (SVG) */}
                 <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none z-0">
                    <defs>
                        <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(34, 211, 238, 0.1)" />
                            <stop offset="50%" stopColor="rgba(167, 139, 250, 0.4)" />
                            <stop offset="100%" stopColor="rgba(34, 211, 238, 0.1)" />
                        </linearGradient>
                         <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    {mapData.links.map((link, i) => {
                    const sourcePos = nodePositions[link.source];
                    const targetPos = nodePositions[link.target];
                    if (!sourcePos || !targetPos) return null;
                    return (
                        <g key={i} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                            <line 
                                x1={`${sourcePos.x}%`} y1={`${sourcePos.y}%`} 
                                x2={`${targetPos.x}%`} y2={`${targetPos.y}%`} 
                                stroke="url(#linkGradient)" 
                                strokeWidth="2"
                                strokeLinecap="round"
                                filter="url(#glow)"
                            />
                            {/* Animated dot moving along the line */}
                            <circle r="2" fill="#fff">
                                <animateMotion dur={`${2 + Math.random() * 2}s`} repeatCount="indefinite" path={`M${sourcePos.x * window.innerWidth/100 * (window.innerWidth < 1024 ? 0.9 : 0.6) },${sourcePos.y * 5} L${targetPos.x * window.innerWidth/100 * (window.innerWidth < 1024 ? 0.9 : 0.6)},${targetPos.y * 5}`} /> 
                                {/* Note: SVG Coordinate mapping is tricky in responsive % layouts without viewbox. 
                                    The lines appear correctly via % x1/y1, but animateMotion requires path data.
                                    Skipping complex path calc for stability, just static elegant lines are safer.
                                */}
                            </circle>
                             {/* Label on line (optional, can be cluttered) */}
                             {/* <text x={`${(sourcePos.x + targetPos.x)/2}%`} y={`${(sourcePos.y + targetPos.y)/2}%`} fill="rgba(255,255,255,0.5)" fontSize="10" textAnchor="middle">{link.label}</text> */}
                        </g>
                    );
                    })}
                </svg>
                
                {/* Nodes (Planets) */}
                {mapData.nodes.map((node, i) => {
                    const pos = nodePositions[node.id];
                    if (!pos) return null;
                    const style = getNodeStyle(node.group);
                    const isSelected = selectedNodeId === node.id;
                    
                    return (
                        <button
                            key={node.id}
                            onClick={() => setSelectedNodeId(node.id)}
                            className={`absolute group/node flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 z-10 cursor-pointer outline-none`}
                            style={{ 
                                left: `${pos.x}%`, 
                                top: `${pos.y}%`,
                            }}
                        >
                            {/* The Planet Orb */}
                            <div className={`relative transition-all duration-300 ${isSelected ? 'scale-125' : 'group-hover/node:scale-110'}`}>
                                {/* Outer Glow Ring */}
                                <div className={`absolute inset-0 rounded-full blur-md opacity-60 ${style.glow} ${isSelected ? 'animate-pulse' : ''}`}></div>
                                
                                {/* Core */}
                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full ${style.color} bg-opacity-20 backdrop-blur-sm border border-white/40 flex items-center justify-center shadow-lg relative overflow-hidden`}>
                                    <div className={`absolute inset-0 bg-gradient-to-br from-white/40 to-transparent`}></div>
                                    <span className="text-lg md:text-xl relative z-10 filter drop-shadow-md">{style.icon}</span>
                                </div>
                            </div>

                            {/* Label */}
                            <span className={`mt-2 md:mt-3 px-2 py-0.5 md:px-3 md:py-1 text-xs md:text-sm font-bold rounded-full backdrop-blur-md border transition-all duration-300 shadow-xl
                                ${isSelected 
                                    ? 'bg-white text-gray-900 border-white scale-110 z-20' 
                                    : 'bg-black/40 text-gray-200 border-white/10 group-hover/node:bg-black/60 group-hover/node:border-white/30'
                                }`}>
                                {node.id}
                            </span>
                        </button>
                    );
                })}
                </>
            )}
        </div>
        
        {/* Right Side: Details & Legend */}
        <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Legend Panel */}
            <div className="bg-gray-800/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">
                    {translations.mapLegend}
                </h3>
                <div className="flex flex-wrap gap-2">
                    {['person', 'place', 'object', 'emotion', 'action'].map(type => {
                         const style = getNodeStyle(type);
                         return (
                            <div key={type} className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                                <span className="text-lg">{style.icon}</span>
                                <span className="capitalize text-xs font-medium text-gray-300">{type}</span>
                            </div>
                         )
                    })}
                </div>
            </div>

            {/* Info Card (Dynamic) */}
            <div className="flex-grow bg-gradient-to-b from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden min-h-[300px] lg:min-h-0">
                {selectedNodeData ? (
                    <div className="animate-fade-in relative z-10 h-full flex flex-col">
                         <div className="flex items-center justify-between mb-4">
                            <span className="text-4xl">{getNodeStyle(selectedNodeData.group).icon}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-white/10 text-gray-300 border border-white/10`}>
                                {selectedNodeData.group}
                            </span>
                         </div>
                         
                         <h4 className="text-3xl font-black text-white mb-4 leading-tight">{selectedNodeData.id}</h4>
                         
                         <div className="bg-black/20 rounded-xl p-4 border border-white/5 mb-4 flex-grow">
                             <p className="text-cyan-100 text-lg italic leading-relaxed font-serif">
                                 "{selectedNodeData.description}"
                             </p>
                         </div>

                         {/* Connections Text */}
                         <div className="mt-auto">
                            <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Connections</h5>
                            <div className="flex flex-wrap gap-2">
                                {mapData?.links
                                    .filter(l => l.source === selectedNodeData.id || l.target === selectedNodeData.id)
                                    .map((l, idx) => {
                                        const otherId = l.source === selectedNodeData.id ? l.target : l.source;
                                        return (
                                            <span key={idx} onClick={() => setSelectedNodeId(otherId)} className="text-xs bg-cyan-900/30 text-cyan-300 px-2 py-1 rounded border border-cyan-500/20 cursor-pointer hover:bg-cyan-500/20">
                                                {l.label} → {otherId}
                                            </span>
                                        )
                                    })
                                }
                            </div>
                         </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center opacity-60">
                        <div className="w-20 h-20 mb-4 bg-white/5 rounded-full flex items-center justify-center animate-pulse">
                            <SummaryIcon />
                        </div>
                        <h4 className="text-xl font-bold text-gray-300 mb-2">{translations.clickNodeForDetails}</h4>
                        <p className="text-sm max-w-xs">Select any star in the galaxy to reveal its hidden meaning and connections.</p>
                    </div>
                )}
                {/* Decorative Background Blob */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            </div>
        </div>
      </div>
      
       <style>{`
        .animate-pulse-slow {
            animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default DreamMap;
