
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { Message } from './Message';
import { SuggestionChip } from './SuggestionChip';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  suggestions: string[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, suggestions }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="w-full h-full bg-gray-800 flex flex-col">
      <header className="flex items-center justify-between p-3 border-b border-gray-700 flex-shrink-0">
        <h2 className="text-md font-bold text-brand-secondary">Talk to Tabby</h2>
      </header>
      
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.map(msg => (
            <Message key={msg.id} message={msg} />
          ))}
          {isLoading && <Message message={{ id: 0, sender: 'ai', text: 'Thinking...' }} />}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
       <div className="p-4 border-t border-gray-700 bg-gray-800">
         <div className="flex flex-wrap gap-2 mb-3">
            {suggestions.map(s => <SuggestionChip key={s} text={s} onClick={() => onSendMessage(s)} />)}
         </div>
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Tabby..."
            className="flex-1 px-4 py-2 bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-secondary text-white"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading} className="bg-brand-secondary text-white rounded-full p-2 hover:bg-blue-500 disabled:bg-gray-600 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
             </svg>
          </button>
        </form>
       </div>
    </div>
  );
};
