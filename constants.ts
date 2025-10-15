import type { Tab, ChatMessage } from './types';

export const INITIAL_TABS: Tab[] = [
  {
    id: '1',
    title: 'React Hooks Documentation',
    url: 'reactjs.org/hooks',
    favicon: '⚛️',
    content: 'Hooks are a new addition in React 16.8. They let you use state and other React features without writing a class. This page provides an overview of the most commonly used hooks like useState, useEffect, and useContext.',
    lastAccessed: Date.now(),
  },
  {
    id: '2',
    title: 'Gemini API Overview',
    url: 'ai.google.dev/docs',
    favicon: '✨',
    content: 'The Gemini API gives you access to Google\'s latest generation of large language models. With the Gemini API, you can build AI-powered features and applications. It supports multimodal prompts, function calling, and streaming.',
    lastAccessed: Date.now(),
  },
  {
    id: '3',
    title: 'Tailwind CSS for modern UI',
    url: 'tailwindcss.com',
    favicon: '💨',
    content: 'Tailwind CSS is a utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90 that can be composed to build any design, directly in your markup. It\'s a great way to rapidly build modern websites.',
    lastAccessed: Date.now() - 5000,
  },
    {
    id: '4',
    title: 'D3.js Data Visualization',
    url: 'd3js.org',
    favicon: '📊',
    content: 'D3.js is a JavaScript library for manipulating documents based on data. D3 helps you bring data to life using HTML, SVG, and CSS. D3’s emphasis on web standards gives you the full capabilities of modern browsers without tying yourself to a proprietary framework.',
    lastAccessed: Date.now() - 15000,
  }
];

export const INITIAL_MESSAGES: ChatMessage[] = [
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I'm Tabby, your AI tab assistant. How can I help you today? You can ask me to find a tab, summarize a page, or recall past sessions.",
    },
];

export const CONTEXT_SUGGESTIONS = [
    "Find the tab about Gemini",
    "Summarize the active tab",
    "Which tabs are idle?",
    "Reopen my design research from yesterday",
];

export const IDLE_TIMEOUT_MS = 10000; // 10 seconds for demo purposes

export const MOCK_MEMORY_TABS: Record<string, Omit<Tab, 'id' | 'lastAccessed' | 'isIdle'>[]> = {
  'design': [
    {
      title: 'UI/UX Design Trends 2024',
      url: 'uxtrends.io/2024',
      favicon: '🎨',
      content: 'This year, we see a rise in bento grids, glassmorphism, and AI-driven user experiences. Designers are focusing more on accessibility and ethical design principles.',
    },
    {
      title: 'Advanced Figma Techniques',
      url: 'figma.com/learn/advanced',
      favicon: '🖌️',
      content: 'Learn about advanced auto-layout, component properties, and creating interactive prototypes with variables in Figma. These techniques can drastically speed up your workflow.',
    },
    {
      title: 'Color Psychology in Branding',
      url: 'branding.com/colors',
      favicon: '🌈',
      content: 'The choice of color can significantly impact brand perception. Blue often conveys trust, while red can evoke excitement. Understanding color psychology is key for effective branding.',
    }
  ],
};