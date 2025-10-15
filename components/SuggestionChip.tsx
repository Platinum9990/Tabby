
import React from 'react';

interface SuggestionChipProps {
  text: string;
  onClick: () => void;
  isAction?: boolean;
}

export const SuggestionChip: React.FC<SuggestionChipProps> = ({ text, onClick, isAction = false }) => {
  const baseClasses = "px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors duration-200";
  const suggestionClasses = "bg-gray-600 hover:bg-gray-500 text-gray-200";
  const actionClasses = "bg-brand-secondary hover:bg-blue-500 text-white";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${isAction ? actionClasses : suggestionClasses}`}
    >
      {text}
    </button>
  );
};
