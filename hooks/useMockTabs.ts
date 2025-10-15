// FIX: Add chrome type declaration to fix compile errors
declare const chrome: any;

import { useState, useEffect, useCallback } from 'react';
import type { Tab } from '../types';
import { INITIAL_TABS, IDLE_TIMEOUT_MS } from '../constants';

const IS_EXTENSION = !!(window.chrome && chrome.tabs);

const chromeTabToAppTab = (chromeTab: chrome.tabs.Tab): Tab => ({
    id: String(chromeTab.id!),
    title: chromeTab.title || 'Untitled',
    url: chromeTab.url || '',
    favicon: chromeTab.favIconUrl || '📄',
    content: '',
    lastAccessed: Date.now(),
    isIdle: false,
});

export const useMockTabs = () => {
  const [tabs, setTabs] = useState<Tab[]>(IS_EXTENSION ? [] : INITIAL_TABS);
  const [activeTabId, setActiveTabId] = useState<string>(IS_EXTENSION ? '' : '1');
  const [tabTimestamps, setTabTimestamps] = useState<Record<string, number>>({});

  const refreshTabs = useCallback(() => {
    if (!IS_EXTENSION) return;

    chrome.tabs.query({}, (chromeTabs) => {
        const now = Date.now();
        const newTimestamps = {...tabTimestamps};
        
        const appTabs = chromeTabs.map(t => {
            const appTab = chromeTabToAppTab(t);
            if (!newTimestamps[appTab.id]) {
                newTimestamps[appTab.id] = now;
            }
            return appTab;
        });

        setTabs(appTabs);
        setTabTimestamps(newTimestamps);
        
        const activeTab = chromeTabs.find(t => t.active && t.windowId === chrome.windows.WINDOW_ID_CURRENT);
        if (activeTab && activeTab.id) {
            const activeId = String(activeTab.id);
            setActiveTabId(activeId);
            setTabTimestamps(prev => ({ ...prev, [activeId]: Date.now() }));
        }
    });
  }, [tabTimestamps]);


  useEffect(() => {
    if (IS_EXTENSION) {
      refreshTabs();

      const onTabChange = () => refreshTabs();
      const onTabActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
          const activeId = String(activeInfo.tabId);
          setActiveTabId(activeId);
          setTabTimestamps(prev => ({...prev, [activeId]: Date.now()}));
      };

      chrome.tabs.onUpdated.addListener(onTabChange);
      chrome.tabs.onRemoved.addListener(onTabChange);
      chrome.tabs.onCreated.addListener(onTabChange);
      chrome.tabs.onActivated.addListener(onTabActivated);

      return () => {
          chrome.tabs.onUpdated.removeListener(onTabChange);
          chrome.tabs.onRemoved.removeListener(onTabChange);
          chrome.tabs.onCreated.removeListener(onTabChange);
          chrome.tabs.onActivated.removeListener(onTabActivated);
      };
    }
  }, [refreshTabs]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTabs(currentTabs =>
        currentTabs.map(tab => {
          const lastAccessed = tabTimestamps[tab.id] || 0;
          if (tab.id !== activeTabId && Date.now() - lastAccessed > IDLE_TIMEOUT_MS) {
            return { ...tab, isIdle: true };
          }
          return { ...tab, isIdle: false };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [activeTabId, tabTimestamps]);

  const handleSetActiveTabId = useCallback((tabId: string) => {
    if (!IS_EXTENSION) {
        setActiveTabId(tabId);
        return;
    }
    const numericTabId = parseInt(tabId, 10);
    if (!isNaN(numericTabId)) {
        chrome.tabs.get(numericTabId, (tab) => {
            if (tab && tab.windowId) {
                chrome.windows.update(tab.windowId, { focused: true });
                chrome.tabs.update(numericTabId, { active: true });
            }
        });
    }
  }, []);

  const closeTab = useCallback((tabId: string) => {
    if (!IS_EXTENSION) {
      setTabs(currentTabs => {
        const newTabs = currentTabs.filter(tab => tab.id !== tabId);
        if (activeTabId === tabId) {
          setActiveTabId(newTabs.length > 0 ? newTabs[0].id : '');
        }
        return newTabs;
      });
      return;
    }
    const numericTabId = parseInt(tabId, 10);
    if (!isNaN(numericTabId)) {
      chrome.tabs.remove(numericTabId);
    }
  }, [activeTabId]);

  const addTab = useCallback((tabData: Pick<Tab, 'url'>) => {
    if (!IS_EXTENSION) {
        const newTab: Tab = {
            id: `new-${Date.now()}`,
            title: tabData.url || 'New Tab',
            url: tabData.url || '',
            favicon: '📄',
            content: 'New tab content.',
            lastAccessed: Date.now(),
            isIdle: false
        };
        setTabs(currentTabs => [...currentTabs, newTab]);
        setActiveTabId(newTab.id);
        return;
    }
    chrome.tabs.create({ url: tabData.url, active: true });
  }, []);

  return { tabs, activeTabId, setActiveTabId: handleSetActiveTabId, closeTab, addTab };
};
