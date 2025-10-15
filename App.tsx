
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { TabList } from './components/TabList';
import { useMockTabs } from './hooks/useMockTabs';
import { UserAction } from './types';
import type { Tab, ChatMessage, ActionResponse } from './types';
import { processUserCommand, getSummaryForTab } from './services/geminiService';
import { INITIAL_MESSAGES, CONTEXT_SUGGESTIONS, MOCK_MEMORY_TABS } from './constants';

const App: React.FC = () => {
  const { tabs, activeTabId, setActiveTabId, closeTab, addTab } = useMockTabs();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  
  const alertedIdleTabs = useRef(new Set<string>());

  const handleNewMessage = async (text: string) => {
    if (isLoading) return;

    if (text.toLowerCase().includes('active tab') && activeTabId) {
      text = text.replace(/active tab/gi, `tab with ID ${activeTabId}`);
    }

    const userMessage: ChatMessage = { id: Date.now(), sender: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const actionResponse = await processUserCommand(text, tabs);
      handleActionResponse(actionResponse, text);
    } catch (error) {
      console.error("Error processing user command:", error);
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "Sorry, I encountered an error. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionResponse = (response: ActionResponse, originalQuery: string) => {
    let aiResponseText = "I'm not sure how to help with that. Could you rephrase?";
    if (response.action === UserAction.SWITCH_TAB) {
      const tabId = response.payload.tabId;
      const targetTab = tabs.find(t => t.id === tabId);
      if (targetTab) {
        setActiveTabId(tabId);
        aiResponseText = `Sure, I've switched to the "${targetTab.title}" tab for you.`;
      } else {
        aiResponseText = `I couldn't find a tab with that name. Maybe it's closed?`;
      }
    } else if (response.action === UserAction.CLOSE_TAB) {
      const tabId = response.payload.tabId;
      const targetTab = tabs.find(t => t.id === tabId);
      if(targetTab) {
        closeTab(tabId);
        aiResponseText = `Okay, I've closed the "${targetTab.title}" tab.`;
      } else {
         aiResponseText = `It seems that tab is already closed.`;
      }
    } else if (response.action === UserAction.RECALL_TABS) {
      const topic = response.payload.topic.toLowerCase();
      const foundKey = Object.keys(MOCK_MEMORY_TABS).find(key => topic.includes(key));
      
      if (foundKey) {
        const tabsToReopen = MOCK_MEMORY_TABS[foundKey];
        if (tabsToReopen.length > 0) {
          tabsToReopen.forEach(tab => addTab(tab));
          aiResponseText = `I've reopened ${tabsToReopen.length} tabs from your session on "${foundKey}".`;
        } else {
           aiResponseText = `I found a session on "${foundKey}", but it was empty.`;
        }
      } else {
        aiResponseText = `Sorry, I couldn't find any saved sessions related to "${topic}".`;
      }
    } else if (response.action === UserAction.CHAT) {
      aiResponseText = response.payload.text;
    } else if (response.action === UserAction.SUMMARIZE_TAB) {
        let tabIdToSummarize = response.payload.tabId;
        if(tabIdToSummarize === 'active') {
            tabIdToSummarize = activeTabId;
        }
        const targetTab = tabs.find(t => t.id === tabIdToSummarize);
        if (targetTab) {
            summarizeAndDisplay(targetTab);
            return; 
        } else {
            aiResponseText = `I couldn't find that tab to summarize.`;
        }
    }

    const aiMessage: ChatMessage = {
      id: Date.now() + 1,
      sender: 'ai',
      text: aiResponseText,
    };
    setMessages(prev => [...prev, aiMessage]);
  };
    
  const summarizeAndDisplay = async (tab: Tab) => {
    setIsLoading(true);
    try {
        const summary = await getSummaryForTab(tab);
        const aiMessage: ChatMessage = {
            id: Date.now(),
            sender: 'ai',
            text: `Here's a summary of the "${tab.title}" tab:\n\n${summary}`
        };
        setMessages(prev => [...prev, aiMessage]);
    } catch(e) {
        console.error("Summarization failed", e);
        const aiMessage: ChatMessage = {
            id: Date.now(),
            sender: 'ai',
            text: `I had trouble summarizing that tab.`
        };
        setMessages(prev => [...prev, aiMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleIdleTab = useCallback(async (tab: Tab) => {
    if (alertedIdleTabs.current.has(tab.id)) return;
    alertedIdleTabs.current.add(tab.id);

    const summary = await getSummaryForTab(tab);
    const idleMessage: ChatMessage = {
      id: Date.now(),
      sender: 'ai',
      text: `The tab "${tab.title}" has been idle for a while. It's about: ${summary}. Would you like to close it?`,
      suggestions: [
        { text: `Yes, close it`, action: () => {
            closeTab(tab.id);
            const confirmation: ChatMessage = { id: Date.now()+1, sender: 'ai', text: `Okay, I've closed it for you!`};
            setMessages(prev => [...prev, confirmation]);
        } },
        { text: 'No, keep it', action: () => {
            const confirmation: ChatMessage = { id: Date.now()+1, sender: 'ai', text: `No problem, I'll keep it open.`};
            setMessages(prev => [...prev, confirmation]);
        }}
      ]
    };
    setMessages(prev => [...prev, idleMessage]);
  }, [closeTab]);

  useEffect(() => {
    const idleTab = tabs.find(t => t.isIdle);
    if (idleTab) {
      handleIdleTab(idleTab);
    }
  }, [tabs, handleIdleTab]);

  return (
    <div className="flex flex-col h-[550px] max-h-[600px] bg-gray-900 text-gray-100 font-sans">
      {/* Top Section: Header & Tabs */}
      <div className="flex-shrink-0 p-4 overflow-y-auto">
        <header className="mb-4">
          <h1 className="text-3xl font-bold text-brand-secondary">TabSense AI</h1>
          <p className="text-gray-400 mt-1 text-sm">Your intelligent browser assistant.</p>
        </header>
        
        <main>
          <TabList tabs={tabs} activeTabId={activeTabId} onTabClick={setActiveTabId} onTabClose={closeTab} />
        </main>
      </div>

      {/* Bottom Section: Chat Interface */}
      <div className="flex-grow flex flex-col min-h-0 border-t border-gray-700">
        <ChatInterface
          messages={messages}
          onSendMessage={handleNewMessage}
          isLoading={isLoading}
          suggestions={CONTEXT_SUGGESTIONS}
        />
      </div>
    </div>
  );
};

export default App;
