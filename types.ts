
export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon: string;
  content?: string;
  lastAccessed: number;
  isIdle?: boolean;
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  suggestions?: Suggestion[];
}

export interface Suggestion {
  text: string;
  action: () => void;
}

export enum UserAction {
  SWITCH_TAB = 'SWITCH_TAB',
  CLOSE_TAB = 'CLOSE_TAB',
  RECALL_TABS = 'RECALL_TABS',
  SUMMARIZE_TAB = 'SUMMARIZE_TAB',
  CHAT = 'CHAT',
  UNKNOWN = 'UNKNOWN',
}

export type ActionResponse = 
  | { action: UserAction.SWITCH_TAB; payload: { tabId: string } }
  | { action: UserAction.CLOSE_TAB; payload: { tabId: string } }
  | { action: UserAction.RECALL_TABS; payload: { topic: string } }
  | { action: UserAction.SUMMARIZE_TAB; payload: { tabId: string } }
  | { action: UserAction.CHAT; payload: { text: string } }
  | { action: UserAction.UNKNOWN; payload: {} };