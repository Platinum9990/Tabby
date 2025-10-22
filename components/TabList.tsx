
import React from 'react';
import type { Tab } from '../types';

interface TabListProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
}

export const TabList: React.FC<TabListProps> = ({ tabs, activeTabId, onTabClick, onTabClose }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-text-primary">Your Open Tabs</h2>
      <div className="flex flex-col gap-2">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => onTabClick(tab.id)}
            className={`relative flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all duration-300 group ${
              activeTabId === tab.id
                ? 'bg-brand-secondary/30 ring-2 ring-brand-secondary shadow-lg'
                : 'bg-glass-bg border border-glass-border hover:bg-glass-bg/80 backdrop-blur-sm'
            }`}
          >
            {activeTabId === tab.id && <div className="absolute -inset-0.5 bg-brand-secondary rounded-lg blur opacity-50"></div>}
            <div className="relative flex items-center truncate">
               {tab.favicon && (tab.favicon.startsWith('http') || tab.favicon.startsWith('data:')) ? (
                 <img src={tab.favicon} alt="favicon" className="w-5 h-5 mr-3" />
               ) : (
                 <span className="mr-3 text-lg">{tab.favicon || '📄'}</span>
               )}
               <span className="truncate text-sm font-medium text-text-primary">{tab.title}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="relative ml-2 p-1 rounded-full text-text-secondary hover:bg-white/10 hover:text-text-primary transition-colors"
              aria-label={`Close tab ${tab.title}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        {tabs.length === 0 && <p className="text-text-secondary text-sm text-center py-4">No tabs are open.</p>}
      </div>
    </div>
  );
};
