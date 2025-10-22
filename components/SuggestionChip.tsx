
import React from 'react';

interface SuggestionChipProps {
  text: string;
  onClick: () => void;
  isAction?: boolean;
}

export const SuggestionChip: React.FC<SuggestionChipProps> = ({ text, onClick, isAction = false }) => {
  const baseClasses = "px-3 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm";
  const suggestionClasses = "bg-bg-secondary hover:bg-gray-700 text-text-secondary border border-glass-border";
  const actionClasses = "bg-brand-secondary hover:bg-blue-500 text-white border border-transparent";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${isAction ? actionClasses : suggestionClasses}`}
    >
      {text}
    </button>
  );
};
