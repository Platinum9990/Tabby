
import React from 'react';
import type { ChatMessage } from '../types';
import { SuggestionChip } from './SuggestionChip';

interface MessageProps {
  message: ChatMessage;
}

const ThinkingIndicator = () => (
  <div className="flex space-x-1">
    <div className="w-2 h-2 bg-brand-accent rounded-full animate-thinking-dots" style={{ animationDelay: '0s' }}></div>
    <div className="w-2 h-2 bg-brand-accent rounded-full animate-thinking-dots" style={{ animationDelay: '0.2s' }}></div>
    <div className="w-2 h-2 bg-brand-accent rounded-full animate-thinking-dots" style={{ animationDelay: '0.4s' }}></div>
  </div>
)

export const Message: React.FC<MessageProps> = ({ message }) => {
  const isAI = message.sender === 'ai';
  const isThinking = message.text === 'Thinking...';

  return (
    <div className={`flex items-start gap-3 ${!isAI && 'justify-end'} animate-fade-in`}>
      {isAI && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bubble-ai-start to-bubble-ai-end flex-shrink-0 flex items-center justify-center text-lg font-bold shadow-md">
          T
        </div>
      )}
      <div className={`max-w-xs md:max-w-md p-3 rounded-xl shadow-lg ${
          isAI ? 'bg-bg-secondary rounded-tl-none text-text-primary' : 'bg-bubble-user rounded-br-none text-white'
        }`}
      >
        {isThinking ? <ThinkingIndicator /> : <p className="text-sm whitespace-pre-wrap">{message.text}</p>}
        {message.suggestions && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.suggestions.map((suggestion, index) => (
              <SuggestionChip key={index} text={suggestion.text} onClick={suggestion.action} isAction={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
