// FIX: Add chrome type declaration to fix compile errors
declare const chrome: any;

import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import type { Tab } from '../types';
import { UserAction, ActionResponse } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const findAndSwitchToTab: FunctionDeclaration = {
    name: 'findAndSwitchToTab',
    description: 'Finds a tab based on a user query about its content or title and makes it the active tab.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            tabId: { type: Type.STRING, description: 'The ID of the tab to switch to.' },
        },
        required: ['tabId'],
    }
};

const closeTab: FunctionDeclaration = {
    name: 'closeTab',
    description: 'Closes a specific tab based on user query.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            tabId: { type: Type.STRING, description: 'The ID of the tab to close.' },
        },
        required: ['tabId'],
    }
};

const requestTabSummary: FunctionDeclaration = {
    name: 'requestTabSummary',
    description: 'Summarizes the content of a specific tab.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            tabId: { type: Type.STRING, description: 'The ID of the tab to summarize. Can be "active" for the currently active tab.' },
        },
        required: ['tabId'],
    }
};


const recallTabsFromMemory: FunctionDeclaration = {
    name: 'recallTabsFromMemory',
    description: 'Reopens tabs from a previous session based on a topic.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            topic: { type: Type.STRING, description: 'The topic of the tabs to recall, e.g., "design research".' },
        },
        required: ['topic'],
    }
};

export const processUserCommand = async (command: string, tabs: Tab[]): Promise<ActionResponse> => {
    const model = 'gemini-2.5-flash';
    const tools = [{ functionDeclarations: [findAndSwitchToTab, closeTab, recallTabsFromMemory, requestTabSummary] }];

    const tabContext = tabs.map(t => `Tab(id: "${t.id}", title: "${t.title}")`).join('\n');
    const systemInstruction = `You are Tabby, an expert AI assistant for browser tab management. 
Your goal is to understand user requests and use the provided tools to manage their tabs.
If the user's request is a command that maps to a tool, call the function. 
If the user is just chatting or asking a general question, respond conversationally.
Here is the current list of open tabs:
${tabContext}
`;
    
    const response = await ai.models.generateContent({
        model,
        contents: command,
        config: {
            systemInstruction,
            tools
        }
    });

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        console.log("Function Call:", call);
        switch (call.name) {
            case 'findAndSwitchToTab':
                return { action: UserAction.SWITCH_TAB, payload: { tabId: call.args.tabId as string } };
            case 'closeTab':
                return { action: UserAction.CLOSE_TAB, payload: { tabId: call.args.tabId as string } };
            case 'requestTabSummary':
                 return { action: UserAction.SUMMARIZE_TAB, payload: { tabId: call.args.tabId as string } };
            case 'recallTabsFromMemory':
                return { action: UserAction.RECALL_TABS, payload: { topic: call.args.topic as string } };
            default:
                return { action: UserAction.UNKNOWN, payload: {} };
        }
    }
    
    return {
        action: UserAction.CHAT,
        payload: { text: response.text }
    };
};

// FIX: Updated function to safely access chrome APIs only when running as an extension. This resolves a runtime error when not in an extension environment.
export const getSummaryForTab = async (tab: Tab): Promise<string> => {
    let content = tab.content || '';

    const IS_EXTENSION = typeof chrome !== 'undefined' && chrome.runtime?.id;
    if (IS_EXTENSION) {
        const tabId = parseInt(tab.id, 10);
        if(!isNaN(tabId)) {
            try {
                const injectionResults = await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: () => document.body.innerText,
                });
        
                if (injectionResults && injectionResults[0] && injectionResults[0].result) {
                    content = injectionResults[0].result as string;
                }
            } catch (e: any) {
                console.error('Scripting Error:', e.message);
                return `Could not access tab "${tab.title}". It might be a protected browser page.`;
            }
        }
    }

    if (!content.trim()) {
        return `The tab "${tab.title}" doesn't seem to have any text content to summarize.`;
    }

    const model = 'gemini-2.5-flash';
    const prompt = `Please provide a concise, one-sentence summary of the following content from the tab titled "${tab.title}":\n\n---\n${content.substring(0, 8000)}\n---`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 0 }
        }
    });

    return response.text;
};
