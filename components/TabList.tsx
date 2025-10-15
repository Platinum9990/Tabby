
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
      <h2 className="text-xl font-semibold mb-4 text-gray-300">Your Open Tabs</h2>
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => onTabClick(tab.id)}
            className={`flex items-center justify-between p-2 pl-3 pr-1 rounded-md cursor-pointer transition-all duration-200 w-full sm:w-auto sm:min-w-[200px] ${
              activeTabId === tab.id
                ? 'bg-brand-secondary text-white shadow-lg'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            <div className="flex items-center truncate">
               {tab.favicon && (tab.favicon.startsWith('http') || tab.favicon.startsWith('data:')) ? (
                 <img src={tab.favicon} alt="favicon" className="w-4 h-4 mr-2" />
               ) : (
                 <span className="mr-2 text-lg">{tab.favicon || '📄'}</span>
               )}
               <span className="truncate text-sm font-medium">{tab.title}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className={`ml-2 p-1 rounded-full ${activeTabId === tab.id ? 'hover:bg-blue-700' : 'hover:bg-gray-500'}`}
              aria-label={`Close tab ${tab.title}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        {tabs.length === 0 && <p className="text-gray-500">No tabs are open.</p>}
      </div>
    </div>
  );
};
