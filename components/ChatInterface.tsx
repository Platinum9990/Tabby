
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
    <div className="w-full h-full bg-bg-primary flex flex-col">
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.map(msg => (
            <Message key={msg.id} message={msg} />
          ))}
          {isLoading && <Message message={{ id: 0, sender: 'ai', text: 'Thinking...' }} />}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
       <div className="p-4 bg-bg-primary">
         <div className="flex flex-wrap gap-2 mb-3">
            {suggestions.map(s => <SuggestionChip key={s} text={s} onClick={() => onSendMessage(s)} />)}
         </div>
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Tabby anything..."
            className="flex-1 px-4 py-2 bg-bg-secondary border border-glass-border rounded-full focus:outline-none focus:ring-2 focus:ring-brand-secondary text-text-primary transition-all"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading} className="bg-brand-primary text-white rounded-full p-2.5 hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-accent">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
             </svg>
          </button>
        </form>
       </div>
    </div>
  );
};
