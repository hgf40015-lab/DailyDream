
import React, { useState, useEffect, useContext, useRef } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { GoogleGenAI, Chat } from '@google/genai';
import { getDreamCoachInitialMessage } from '../services/geminiService';
import { StoredDream } from '../types';
import { DreamCoachIcon, SendIcon, RefreshIcon, TrashIcon } from './icons/Icons';

type ConversationMessage = {
  role: 'user' | 'model';
  text: string;
};

const DreamCoach: React.FC = () => {
  const { translations, language } = useContext(LanguageContext);
  const [chat, setChat] = useState<Chat | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!language) return;

    const initializeCoach = async () => {
        setIsInitializing(true);
        const savedHistory = localStorage.getItem('coach-chat-history');
        if (savedHistory) {
            setConversation(JSON.parse(savedHistory));
        } else {
            // Check if we should use a dream-based greeting
            const savedDreamsRaw = localStorage.getItem('user-dreams');
            const dreams: StoredDream[] = savedDreamsRaw ? JSON.parse(savedDreamsRaw) : [];
            let initialMessage = translations.initialCoachMessage;

            if (dreams.length > 0) {
                try {
                    const recentDreams = dreams.slice(-3); 
                    const coachMsg = await getDreamCoachInitialMessage(recentDreams, language);
                    initialMessage = coachMsg.message;
                } catch (e) {
                    console.error("Could not fetch initial coach message", e);
                }
            }
            setConversation([{ role: 'model', text: initialMessage }]);
        }
        
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("API_KEY not found");
            setConversation(prev => [...prev, { role: 'model', text: 'Configuration error: API Key is missing.'}]);
            return;
        }
        // Fix: Create fresh GoogleGenAI instance for selected API key support
        const ai = new GoogleGenAI({ apiKey });
        // Fix: Update model to gemini-3-flash-preview
        const chatSession = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            // STRICT DREAM COACH SYSTEM INSTRUCTION
            systemInstruction: `You are a dedicated AI Dream Coach and Symbolism Expert named 'Murabbiy'. You speak in ${language}.
            
            YOUR ROLE:
            - Interpret dreams using Islamic (Ibn Sirin), Psychological (Jung/Freud), and Mystical perspectives.
            - Help users understand their subconscious mind, emotions, and hidden fears/desires.
            - Provide calming advice related to sleep and nightmares.
            
            STRICT CONSTRAINTS:
            - You ONLY answer questions related to Dreams, Sleep, Psychology of Dreams, Symbolism, and Spiritual visions.
            - If a user asks about Math, Physics, Coding, Politics, or General Knowledge unrelated to dreams, you MUST politely refuse.
            - Refusal phrase example (translate to ${language}): "I specialize only in the world of dreams and the subconscious. I cannot help with other topics."
            
            TONE:
            - Mystical, wise, calming, and supportive.
            `,
          },
        });
        setChat(chatSession);
        setIsInitializing(false);
    };

    initializeCoach();

  }, [language, translations.initialCoachMessage]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversation, isLoading]);
  
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !chat) return;

    const userMessage: ConversationMessage = { role: 'user', text: text };
    const newConversation = [...conversation, userMessage];
    setConversation(newConversation);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await chat.sendMessage({ message: text });
      const modelMessage: ConversationMessage = { role: 'model', text: response.text };
      const finalConversation = [...newConversation, modelMessage];
      setConversation(finalConversation);
      localStorage.setItem('coach-chat-history', JSON.stringify(finalConversation));
    } catch (error) {
      console.error(error);
      const errorMessage: ConversationMessage = { role: 'model', text: translations.error };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSendMessage(userInput);
  }

  const startNewSession = () => {
    localStorage.removeItem('coach-chat-history');
    setConversation([{ role: 'model', text: translations.initialCoachMessage }]);
    setIsInitializing(false); // Reset UI state without full re-init needed for chat object
  };

  // Dream-focused suggestions
  const suggestions = [
      translations.coachSuggestion1,
      translations.coachSuggestion2,
      translations.coachSuggestion3,
      translations.coachSuggestion4,
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full max-h-[85vh]">
      <div className="text-center mb-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-[60px] -z-10"></div>
        <div className="w-16 h-16 mx-auto text-cyan-300 mb-2 drop-shadow-lg">
            <DreamCoachIcon />
        </div>
        <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-300 to-purple-400 text-glow">
          {translations.dreamCoachTitle}
        </h2>
        <p className="text-gray-400 text-sm">{translations.dreamCoachSubtitle}</p>
        
        <div className="absolute top-0 right-0">
             <button onClick={startNewSession} title={translations.clearHistory} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
                <div className="w-5 h-5"><TrashIcon /></div>
            </button>
        </div>
      </div>

      <div ref={chatContainerRef} className="flex-grow bg-gray-900/40 border border-white/10 rounded-3xl p-6 space-y-6 overflow-y-auto mb-4 custom-scrollbar backdrop-blur-sm shadow-inner">
        {isInitializing ? (
             <div className="flex justify-center items-center h-full text-cyan-300 gap-3">
                 <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                 {translations.loading}
             </div>
        ) : (
            <>
            {conversation.map((msg, index) => (
            <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                {msg.role === 'model' && (
                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg border border-white/20">
                    <span className="text-[10px]">AI</span>
                </div>
                )}
                <div className={`max-w-[90%] sm:max-w-[80%] p-4 rounded-2xl shadow-lg leading-relaxed text-base ${
                    msg.role === 'user' 
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none border border-white/10' 
                    : 'bg-gray-800/80 text-gray-100 rounded-bl-none border border-white/5'
                }`}>
                <p className="whitespace-pre-wrap font-sans">{msg.text}</p>
                </div>
            </div>
            ))}
            
            {isLoading && (
            <div className="flex items-end gap-3 justify-start animate-fade-in">
                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg">AI</div>
                <div className="p-4 rounded-2xl bg-gray-800/80 text-gray-200 rounded-bl-none border border-white/5">
                <div className="flex items-center gap-1.5 h-6">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></span>
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></span>
                </div>
                </div>
            </div>
            )}
            </>
        )}
      </div>

      {/* Suggestions */}
      {!isLoading && conversation.length < 3 && (
          <div className="flex gap-2 overflow-x-auto pb-4 px-2 no-scrollbar">
              {suggestions.map((sug, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSendMessage(sug)}
                    className="whitespace-nowrap px-4 py-2 bg-gray-800/60 border border-purple-500/30 rounded-full text-xs text-purple-200 hover:bg-purple-500/20 hover:border-purple-400 transition-all"
                  >
                      {sug}
                  </button>
              ))}
          </div>
      )}

      <form onSubmit={handleFormSubmit} className="flex items-center gap-3 bg-gray-900/60 p-2 rounded-full border border-white/10 backdrop-blur-md">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleFormSubmit(e);
            }
          }}
          placeholder={translations.chatPlaceholder}
          className="flex-grow px-6 py-3 bg-transparent border-none focus:ring-0 outline-none text-lg text-white placeholder-gray-500 resize-none h-12 pt-2.5"
          rows={1}
          disabled={isLoading || isInitializing}
        />
        <button type="submit" disabled={isLoading || isInitializing || !userInput.trim()} className="w-10 h-10 flex items-center justify-center text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full shadow-lg hover:shadow-cyan-500/50 transform enabled:hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="w-5 h-5 block ml-0.5"><SendIcon /></span>
        </button>
      </form>
    </div>
  );
};

export default DreamCoach;
