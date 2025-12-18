import React, { useState, useEffect, useContext, useRef } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { GoogleGenAI, Chat, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { MotivationalChatIcon, SendIcon, RefreshIcon } from './icons/Icons';

type ConversationMessage = {
  role: 'user' | 'model';
  text: string;
};

const Articles: React.FC = () => {
  const { translations, language } = useContext(LanguageContext);
  const [chat, setChat] = useState<Chat | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!language) return;

    const savedHistory = localStorage.getItem('motivational-chat-history');
    const initialHistory: ConversationMessage[] = savedHistory
      ? JSON.parse(savedHistory)
      : [{ role: 'model', text: translations.initialMotivationalMessage }];
    setConversation(initialHistory);

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY not found");
      setConversation(prev => [...prev, { role: 'model', text: 'Configuration error: API Key is missing.' }]);
      return;
    }
    const ai = new GoogleGenAI({ apiKey });

    const safetySettings = [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
    ];
    
    const chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are Ziyo, an empathetic and highly motivational AI companion on a dream analysis website, speaking in ${language}. Your name means 'light' in Uzbek. Your purpose is to be a source of inspiration, warmth, and encouragement. Use a gentle, positive, and supportive tone. Ask insightful, open-ended questions to help users explore their feelings, overcome self-doubt, and find motivation to pursue their goals. Celebrate their small wins and offer comforting words for their struggles. Your goal is to make the user feel heard, valued, and empowered. Strictly avoid generating any harmful, unethical, or inappropriate content. Start the conversation by introducing yourself and gently asking what's on their mind or what they hope to achieve today.`,
        safetySettings,
      },
    });
    setChat(chatSession);

  }, [language, translations.initialMotivationalMessage]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || !chat) return;

    const userMessage: ConversationMessage = { role: 'user', text: userInput };
    const newConversation = [...conversation, userMessage];
    setConversation(newConversation);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await chat.sendMessage({ message: userInput });
      const modelMessage: ConversationMessage = { role: 'model', text: response.text };
      const finalConversation = [...newConversation, modelMessage];
      setConversation(finalConversation);
      localStorage.setItem('motivational-chat-history', JSON.stringify(finalConversation));
    } catch (error) {
      console.error(error);
      const errorMessage: ConversationMessage = { role: 'model', text: translations.error };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewSession = () => {
    localStorage.removeItem('motivational-chat-history');
    setConversation([{ role: 'model', text: translations.initialMotivationalMessage }]);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full max-h-[85vh]">
      <div className="text-center mb-4">
        <div className="text-green-300 w-12 h-12 mx-auto mb-2">
            <MotivationalChatIcon /> 
        </div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-cyan-400 text-glow">
          {translations.motivationalChatTitle}
        </h2>
        <p className="text-gray-400">{translations.motivationalChatSubtitle}</p>
      </div>

      <div ref={chatContainerRef} className="flex-grow bg-gray-900/50 border border-purple-400/20 rounded-lg p-4 space-y-4 overflow-y-auto mb-4 custom-scrollbar">
        {conversation.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-green-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">Z</div>
            )}
            <div className={`max-w-lg p-3 rounded-xl shadow-md ${msg.role === 'user' ? 'bg-purple-700 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end gap-2 justify-start">
             <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-green-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">Z</div>
            <div className="p-3 rounded-xl bg-gray-700 text-gray-200 rounded-bl-none">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <button type="button" onClick={startNewSession} title={translations.startNewSession} className="p-3 text-gray-400 bg-gray-800/60 rounded-full hover:bg-purple-500/20 hover:text-white transition-colors">
            <span className="w-6 h-6 block"><RefreshIcon /></span>
        </button>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
          placeholder={translations.motivationalPlaceholder}
          className="flex-grow p-3 bg-gray-800/60 border-2 border-purple-400/40 rounded-full focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all duration-300 text-lg text-white placeholder-gray-400 resize-none"
          rows={1}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !userInput.trim()} className="p-3 text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full shadow-lg hover:shadow-cyan-500/50 transform enabled:hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="w-6 h-6 block"><SendIcon /></span>
        </button>
      </form>
    </div>
  );
};

export default Articles;