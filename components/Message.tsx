
import React from 'react';
import type { ChatMessage } from '../types';
import { SuggestionChip } from './SuggestionChip';

interface MessageProps {
  message: ChatMessage;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const isAI = message.sender === 'ai';
  const thinking = message.text === 'Thinking...';

  return (
    <div className={`flex items-start gap-3 ${!isAI && 'justify-end'}`}>
      {isAI && (
        <div className="w-8 h-8 rounded-full bg-brand-secondary flex-shrink-0 flex items-center justify-center text-lg">
          ✨
        </div>
      )}
      <div className={`max-w-xs md:max-w-md p-3 rounded-xl ${
          isAI ? 'bg-gray-700 rounded-tl-none' : 'bg-brand-primary rounded-br-none text-white'
        }`}
      >
        <p className={`text-sm whitespace-pre-wrap ${thinking && 'italic text-gray-400'}`}>{message.text}</p>
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
