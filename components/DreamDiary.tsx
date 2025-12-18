import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { TrashIcon, DreamProfileIcon } from './icons/Icons';
import { StoredDream } from '../types';

const DreamDiary: React.FC = () => {
  const [dreams, setDreams] = useState<StoredDream[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { translations, language } = useContext(LanguageContext);

  useEffect(() => {
    const savedDreams = localStorage.getItem('user-dreams');
    if (savedDreams) {
      const parsedDreams: StoredDream[] = JSON.parse(savedDreams);
      parsedDreams.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setDreams(parsedDreams);
    }
  }, []);

  const handleDeleteDream = (indexToDelete: number) => {
    const updatedDreams = dreams.filter((_, index) => index !== indexToDelete);
    setDreams(updatedDreams);
    localStorage.setItem('user-dreams', JSON.stringify(updatedDreams));
  };

  const handleEditReflection = (index: number) => {
    setEditingIndex(index);
    setReflectionText(dreams[index].reflection || '');
    setTagsText(dreams[index].tags ? dreams[index].tags!.join(', ') : '');
  };
  
  const handleSaveReflection = (indexToSave: number) => {
    const updatedDreams = [...dreams];
    updatedDreams[indexToSave].reflection = reflectionText;
    updatedDreams[indexToSave].tags = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setDreams(updatedDreams);
    localStorage.setItem('user-dreams', JSON.stringify(updatedDreams));
    setEditingIndex(null);
    setReflectionText('');
    setTagsText('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language || 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  const allTags = Array.from(new Set(dreams.flatMap(d => d.tags || [])));

  const filteredDreams = selectedTag 
    ? dreams.filter(d => d.tags && d.tags.includes(selectedTag))
    : dreams;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-glow">{translations.diaryTitle}</h2>
        <p className="text-gray-300">{translations.diarySubtitle}</p>
      </div>

      {/* Filter Bar */}
      {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
              <button 
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 rounded-full text-sm font-bold border transition-all ${!selectedTag ? 'bg-cyan-500 text-white border-cyan-400' : 'bg-gray-800 text-gray-400 border-gray-600'}`}
              >
                  All
              </button>
              {allTags.map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-bold border transition-all ${selectedTag === tag ? 'bg-cyan-500 text-white border-cyan-400' : 'bg-gray-800 text-gray-400 border-gray-600'}`}
                  >
                      #{tag}
                  </button>
              ))}
          </div>
      )}

      {filteredDreams.length > 0 ? (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {filteredDreams.map((entry, index) => (
            <div
              key={index}
              className="bg-gray-800/50 p-4 rounded-xl border border-purple-400/20 flex flex-col justify-between items-start animate-fade-in-up hover:bg-gray-800/80 transition-colors"
               style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="w-full">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-cyan-300 font-semibold text-sm">{formatDate(entry.date)}</p>
                            {entry.sentiment && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                    entry.sentiment === 'positive' ? 'border-green-500 text-green-400' : 
                                    entry.sentiment === 'negative' ? 'border-red-500 text-red-400' : 'border-gray-500 text-gray-400'
                                }`}>
                                    {entry.sentiment}
                                </span>
                            )}
                        </div>
                        <p className="text-gray-200 mt-2 whitespace-pre-wrap text-lg font-medium">{entry.dream}</p>
                    </div>
                    <button
                        onClick={() => handleDeleteDream(index)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 rounded-full hover:bg-red-500/10"
                        title={translations.deleteDream}
                    >
                        <span className="w-5 h-5 block">
                        <TrashIcon />
                        </span>
                    </button>
                </div>

                {/* Tags Display */}
                {entry.tags && entry.tags.length > 0 && editingIndex !== index && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {entry.tags.map((tag, i) => (
                            <span key={i} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30">#{tag}</span>
                        ))}
                    </div>
                )}

                <div className="mt-4 border-t border-purple-400/20 pt-3">
                    {editingIndex === index ? (
                        <div className="bg-black/20 p-4 rounded-lg">
                            <textarea 
                                value={reflectionText}
                                onChange={(e) => setReflectionText(e.target.value)}
                                placeholder={translations.addReflection}
                                className="w-full h-24 p-3 bg-gray-700/60 border border-purple-400/40 rounded-lg focus:ring-2 focus:ring-cyan-400 outline-none transition-all text-white placeholder-gray-400 text-sm mb-3"
                            />
                            <input 
                                type="text"
                                value={tagsText}
                                onChange={(e) => setTagsText(e.target.value)}
                                placeholder={translations.tags}
                                className="w-full p-3 bg-gray-700/60 border border-purple-400/40 rounded-lg focus:ring-2 focus:ring-cyan-400 outline-none transition-all text-white placeholder-gray-400 text-sm mb-3"
                            />
                            <div className="flex gap-2">
                                <button onClick={() => handleSaveReflection(index)} className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-bold hover:bg-cyan-500 transition-colors">{translations.save}</button>
                                <button onClick={() => setEditingIndex(null)} className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-bold hover:bg-gray-500 transition-colors">{translations.close}</button>
                            </div>
                        </div>
                    ) : (
                        <div className="cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors" onClick={() => handleEditReflection(index)}>
                            {entry.reflection ? (
                                <div className="flex gap-2 items-start">
                                    <span className="text-purple-400 text-xl">❝</span>
                                    <p className="text-gray-300 italic text-sm whitespace-pre-wrap leading-relaxed">{entry.reflection}</p>
                                </div>
                            ) : (
                                <button className="text-cyan-400 hover:text-cyan-300 text-sm font-bold flex items-center gap-1">
                                    + {translations.addReflection} / {translations.tags}
                                </button>
                            )}
                        </div>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-gray-800/30 rounded-3xl border border-purple-400/10">
            <div className="w-20 h-20 mx-auto text-gray-600 mb-6"><DreamProfileIcon /></div>
            <p className="text-gray-400 text-xl font-medium">{translations.noDreams}</p>
        </div>
      )}
    </div>
  );
};

export default DreamDiary;