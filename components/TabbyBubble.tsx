
import React from 'react';

interface TabbyBubbleProps {
  onClick: () => void;
}

export const TabbyBubble: React.FC<TabbyBubbleProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-6 w-16 h-16 bg-bubble rounded-full flex items-center justify-center text-white shadow-2xl hover:bg-brand-secondary focus:outline-none focus:ring-4 focus:ring-brand-secondary focus:ring-opacity-50 transition-all duration-300 animate-subtle-pulse z-50"
      aria-label="Open Tabby Assistant"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
        <path d="M12.25 15.25c.41 0 .75-.34.75-.75s-.34-.75-.75-.75-.75.34-.75.75.34.75.75.75zm2.5-2c.41 0 .75-.34.75-.75s-.34-.75-.75-.75-.75.34-.75.75.34.75.75.75zm-5 0c.41 0 .75-.34.75-.75s-.34-.75-.75-.75-.75.34-.75.75.34.75.75.75zm2.5-2c.41 0 .75-.34.75-.75s-.34-.75-.75-.75-.75.34-.75.75.34.75.75.75z"/>
      </svg>
    </button>
  );
};
