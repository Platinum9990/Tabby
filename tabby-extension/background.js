// Background service worker for Tabby (prototype)

// --- Enhanced AI Integration with Chrome's Built-in APIs ---
// Prompt API: Main "brain" for generating text and structured output
// Summarizer API: Distill long text into short insights
// Writer API: Create new, original text
// Rewriter API: Improve or rephrase existing content
// Translator API: Multi-language capabilities
// Proofreader API: Correct grammar mistakes
// --------------------------------------------------------

// Keep a simple in-memory map of tabId -> metadata
const tabMeta = {};
// Store recently closed tabs (max 20) - Loaded from storage on startup
let recentlyClosed = [];
// Store last interacted/created tab info
let lastOpenedTabInfo = null;

// AI API Availability Check
let aiCapabilities = {
  prompt: false,
  summarizer: false,
  writer: false,
  rewriter: false,
  translator: false,
  proofreader: false
};

// Initialize AI capabilities on startup
async function initializeAI() {
  try {
    if (chrome.ai) {
      // Check Prompt API
      if (chrome.ai.canCreateTextSession) {
        const availability = await chrome.ai.canCreateTextSession();
        aiCapabilities.prompt = availability === 'readily';
      }
      
      // Check Summarizer API
      if (chrome.ai.summarizer && chrome.ai.summarizer.capabilities) {
        const sumCapabilities = await chrome.ai.summarizer.capabilities();
        aiCapabilities.summarizer = sumCapabilities.available === 'readily';
      }
      
      // Check Writer API
      if (chrome.ai.writer && chrome.ai.writer.capabilities) {
        const writerCapabilities = await chrome.ai.writer.capabilities();
        aiCapabilities.writer = writerCapabilities.available === 'readily';
      }
      
      // Check Rewriter API
      if (chrome.ai.rewriter && chrome.ai.rewriter.capabilities) {
        const rewriterCapabilities = await chrome.ai.rewriter.capabilities();
        aiCapabilities.rewriter = rewriterCapabilities.available === 'readily';
      }
      
      // Check Translator API
      if (chrome.ai.translator && chrome.ai.translator.capabilities) {
        const translatorCapabilities = await chrome.ai.translator.capabilities();
        aiCapabilities.translator = translatorCapabilities.available === 'readily';
      }
      
      // Check Proofreader API (if available)
      if (chrome.ai.proofreader && chrome.ai.proofreader.capabilities) {
        const proofreaderCapabilities = await chrome.ai.proofreader.capabilities();
        aiCapabilities.proofreader = proofreaderCapabilities.available === 'readily';
      }
      
      console.log('AI Capabilities initialized:', aiCapabilities);
    }
  } catch (error) {
    console.warn('Error initializing AI capabilities:', error);
  }
}

// Initialize AI on startup
initializeAI();

// --- Load initial state from storage ---
chrome.storage.local.get(['recentlyClosed', 'lastOpenedTabInfo'], (result) => {
  recentlyClosed = result.recentlyClosed || [];
  lastOpenedTabInfo = result.lastOpenedTabInfo || null;
});
// ------------------------------------

// Helper: fetch page text from content script
async function fetchTabContent(tabId, url) { // Pass URL for checking
  // --- FIX: Prevent accessing restricted URLs ---
  if (url && (url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('chrome-extension://'))) {
    console.warn(`Skipping fetchTabContent for restricted URL: ${url}`);
    return null; // Stop execution for restricted URLs
  }
  // -------------------------------------------
  try {
    // Ensure the scripting permission is granted for the URL if needed,
    // though executeScript on the active tab usually works if triggered by user action.
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // --- Improved Text Extraction (more robust) ---
        function isVisible(elem) {
          if (!(elem instanceof Element)) return false;
          const style = window.getComputedStyle(elem);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
          if (elem.offsetWidth === 0 && elem.offsetHeight === 0) return false; // Check size
          const rect = elem.getBoundingClientRect();
          return rect.top < window.innerHeight && rect.bottom >= 0 &&
                 rect.left < window.innerWidth && rect.right >= 0;
        }

        function extractVisibleText(node) {
          let text = '';
          if (!node || !isVisible(node)) return text; // Check visibility

          if (node.nodeType === Node.TEXT_NODE) {
            text += (node.textContent || '').trim() + ' ';
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            if (tagName === 'script' || tagName === 'style' || tagName === 'noscript' || tagName === 'head' || tagName === 'meta') {
              // Skip script/style tags and non-visible elements
            } else if (tagName === 'br') {
               text += '\n'; // Add newline for breaks
            } else {
              for (const child of node.childNodes) {
                text += extractVisibleText(child);
              }
            }
          }
          return text;
        }
        const extractedText = extractVisibleText(document.body).replace(/\s\s+/g, ' ').trim(); // Clean up whitespace
        return {
           title: document.title,
           url: location.href,
           // Limit text length to avoid excessive storage/processing
           text: extractedText.slice(0, 10000)
        };
        // ------------------------------------------
      }
    });
    // executeScript returns an array, handle cases where it might be empty or injection failed
    return (results && results.length > 0) ? results[0].result : null;
  } catch (err) {
    // Log specific errors if possible, e.g., missing host permissions
    if (err.message.includes("Cannot access contents of url")) {
        console.warn(`fetchTabContent failed for tab ${tabId}: Missing host permissions or restricted page (${url})`);
    } else if (!err.message.includes('No tab with id')) { // Ignore errors for already closed tabs
        console.warn('fetchTabContent failed', err);
    }
    return null;
  }
}

// --- Track last created/interacted tab ---
// Listen for tab creation
chrome.tabs.onCreated.addListener(tab => {
    // Store preliminary info, might update later in onUpdated
    if (tab.id) {
        lastOpenedTabInfo = { id: tab.id, title: tab.title, url: tab.url, openedAt: Date.now() };
        // Don't save to storage yet, wait for completion in onUpdated
    }
});
// ---------------------------------------


// When a tab is updated, store metadata and schedule idle alarm
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Wait for page load completion to get accurate title/content
  if (changeInfo.status === 'complete' && tab.url) { // Make sure URL exists
    const info = await fetchTabContent(tabId, tab.url); // Pass URL here
    if (info) {
      tabMeta[tabId] = { title: info.title, url: info.url, text: info.text, lastActive: Date.now() };
      console.log(`Updated metadata for tab ${tabId}: ${info.title}`);
       // --- FIX: Clear previous alarm before creating a new one ---
       chrome.alarms.clear('idle-check-' + tabId);
       // Set an alarm to consider idle (e.g., after 30 minutes)
       chrome.alarms.create('idle-check-' + tabId, { delayInMinutes: 30 }); // Adjust time as needed
       // --------------------------------------------------------

       // --- FIX: Update lastOpenedTabInfo if this is the tab we just created ---
       if (lastOpenedTabInfo && lastOpenedTabInfo.id === tabId) {
            lastOpenedTabInfo.title = info.title;
            lastOpenedTabInfo.url = info.url;
            chrome.storage.local.set({ lastOpenedTabInfo }); // Now save reliable info
            console.log("Updated and saved lastOpenedTabInfo:", lastOpenedTabInfo);
       }
       // -------------------------------------------------------------------
    }
  }
});

// Track closed tabs
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  const meta = tabMeta[tabId];
  if (meta && meta.url && !meta.url.startsWith('chrome://')) { // Don't store closed internal pages
    recentlyClosed.unshift({ title: meta.title, url: meta.url, closedAt: Date.now() });
    if (recentlyClosed.length > 20) recentlyClosed.pop(); // Limit size
    chrome.storage.local.set({ recentlyClosed });
    console.log(`Added to recently closed: ${meta.title}`);
  }
  // Clean up metadata and any pending alarms
  delete tabMeta[tabId];
  chrome.alarms.clear('idle-check-' + tabId);
  console.log(`Cleaned up metadata/alarm for closed tab ${tabId}`);
});

// Update last active time when a tab becomes active
chrome.tabs.onActivated.addListener(activeInfo => {
  const meta = tabMeta[activeInfo.tabId];
  if (meta) {
    meta.lastActive = Date.now();
    // No need to save tabMeta to storage, it's in-memory
    console.log(`Tab ${activeInfo.tabId} activated.`);
    // Clear and reset the idle alarm for the activated tab
    chrome.alarms.clear('idle-check-' + activeInfo.tabId);
    chrome.alarms.create('idle-check-' + activeInfo.tabId, { delayInMinutes: 30 }); // Reset timer
  }
});

// Alarm handler: Check for idle tabs and potentially summarize
chrome.alarms.onAlarm.addListener(async alarm => {
  if (!alarm.name.startsWith('idle-check-')) return;

  const tabId = parseInt(alarm.name.replace('idle-check-', ''), 10);
  const meta = tabMeta[tabId];

  // Check if tab still exists and has metadata
  try {
     const tab = await chrome.tabs.get(tabId);
     if (!meta) {
        console.log(`Alarm fired for tab ${tabId}, but no metadata found.`);
        return;
     }
  } catch (error) {
     // Tab likely closed, clear metadata if it somehow persists
     console.log(`Alarm fired for closed tab ${tabId}. Cleaning up.`);
     delete tabMeta[tabId];
     return;
  }


  // Check actual idle time against lastActive timestamp
  const idleMinutes = (Date.now() - (meta.lastActive || Date.now())) / 60000;
  console.log(`Idle check for tab ${tabId}: ${idleMinutes.toFixed(2)} minutes.`);

  // --- Adjust idle threshold as needed ---
  if (idleMinutes < 29.5) { // Check slightly before 30 min to avoid race conditions
     // Tab was active more recently than the alarm delay, reset alarm
     chrome.alarms.clear(alarm.name);
     chrome.alarms.create(alarm.name, { delayInMinutes: 30 - idleMinutes });
     console.log(`Tab ${tabId} was active recently, resetting idle alarm.`);
     return;
  }
  // ---------------------------------------

  // --- Hackathon Suggestion: Replace Server Call with Built-in Summarizer/Prompt API ---
  console.log(`Tab ${tabId} (${meta.title}) is idle. Summarizing...`);
  let summary = 'Could not summarize.';
  try {
     // --- Enhanced AI Summarization with Multiple APIs ---
     if (aiCapabilities.summarizer && chrome.ai.summarizer && meta.text) {
       // Use dedicated Summarizer API for best results
       const summarizer = await chrome.ai.summarizer.create({
         type: 'tl;dr',
         format: 'plain-text',
         length: 'short'
       });
       summary = await summarizer.summarize(meta.text.slice(0, 4000));
       await summarizer.destroy();
       console.log('Used Summarizer API for tab summary');
       
     } else if (aiCapabilities.prompt && chrome.ai && meta.text) {
       // Fallback to Prompt API with specialized prompt
       const session = await chrome.ai.createTextSession();
       const prompt = `You are a helpful browser assistant. Summarize this web page content in 1-2 clear sentences, focusing on the main topic and key insights:

Title: ${meta.title}
Content: ${meta.text.slice(0, 2000)}

Summary:`;
       summary = await session.prompt(prompt);
       await session.destroy();
       console.log('Used Prompt API for tab summary');
       
     } else {
       summary = 'AI summarization not available for this tab.';
       console.warn('No AI capabilities available for summarization');
     }

     console.log(`Summary for idle tab ${tabId}: ${summary}`);

     // --- FIX: Use Notification Buttons (Manifest V3) ---
     chrome.notifications.create('tabby-idle-' + tabId, { // Changed prefix slightly
       type: 'basic',
       title: `Tabby: Idle Tab "${meta.title}"`,
       message: `Summary: ${summary}\nClose this idle tab?`,
       iconUrl: 'icon-48.png', // Ensure this path is correct relative to root
       buttons: [ // Requires "notifications" permission
         { title: 'Close Tab' },
         { title: 'Keep Open' }
       ],
       requireInteraction: true // Keep notification until user interacts
     });
     // Store summary locally (optional, maybe store only if kept open?)
     // chrome.storage.local.set({ [`summary-${tabId}`]: { /* ... */ } });

  } catch (err) {
    console.error(`Summarization/Notification failed for idle tab ${tabId}:`, err);
    // Optionally notify user about the failure
    // chrome.notifications.create(...);
  }
  // ---------------------------------------------------------------------------------
});

// --- FIX: Handle Notification Button Clicks ---
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (!notificationId.startsWith('tabby-idle-')) return;

  const tabId = parseInt(notificationId.replace('tabby-idle-', ''), 10);
  console.log(`Notification button clicked for tab ${tabId}. Button index: ${buttonIndex}`);

  if (buttonIndex === 0) { // First button: "Close Tab"
    console.log(`Closing tab ${tabId} via notification.`);
    chrome.tabs.remove(tabId).catch(err => console.warn(`Failed to close tab ${tabId}: ${err.message}`)); // Ignore if already closed
    // Optional: Update storage if you were tracking summaries
  } else if (buttonIndex === 1) { // Second button: "Keep Open"
     console.log(`Keeping tab ${tabId} open.`);
     // User wants to keep it, reset its idle timer by updating lastActive and resetting alarm
     const meta = tabMeta[tabId];
     if (meta) {
       meta.lastActive = Date.now();
       chrome.alarms.clear('idle-check-' + tabId);
       chrome.alarms.create('idle-check-' + tabId, { delayInMinutes: 30 });
       console.log(`Reset idle timer for tab ${tabId}.`);
     }
  }

  // Clear the notification after handling the click
  chrome.notifications.clear(notificationId);
});
// ----------------------------------------

// --- Remove old onClicked handler for notifications ---
// chrome.notifications.onClicked.addListener(notificationId => { ... }); // REMOVE THIS OLD ONE
// ------------------------------------------------------


// Message handling from popup/content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    // --- New AI-Enhanced Commands ---
    if (msg.type === 'aiChat') {
      console.log('Received aiChat message:', msg.query);
      try {
        if (!aiCapabilities.prompt || !chrome.ai) {
          throw new Error("AI chat not available.");
        }

        const session = await chrome.ai.createTextSession();
        
        // Enhanced context-aware prompt
        const tabCount = Object.keys(tabMeta).length;
        const activeTabInfo = await chrome.tabs.query({active: true, currentWindow: true});
        const activeTab = activeTabInfo[0];
        
        const prompt = `You are Tabby, an intelligent browser assistant. Context:
- User has ${tabCount} open tabs
- Currently viewing: ${activeTab?.title || 'Unknown page'}
- Available commands: find tabs, summarize content, manage browsing sessions

User question: "${msg.query}"

Provide a helpful, concise response as their browsing companion:`;

        const response = await session.prompt(prompt);
        await session.destroy();
        
        sendResponse({ ok: true, response });
      } catch (err) {
        console.error('AI Chat failed:', err);
        sendResponse({ ok: false, error: `AI chat failed: ${err.message}` });
      }

    } else if (msg.type === 'summarizeTab') {
      console.log('Received summarizeTab message:', msg.tabId);
      try {
        const tabId = msg.tabId || (await chrome.tabs.query({active: true, currentWindow: true}))[0]?.id;
        const meta = tabMeta[tabId];
        
        if (!meta || !meta.text) {
          sendResponse({ ok: false, error: "No content available for this tab." });
          return;
        }

        let summary = '';
        if (aiCapabilities.summarizer && chrome.ai.summarizer) {
          const summarizer = await chrome.ai.summarizer.create({
            type: 'key-points',
            format: 'plain-text',
            length: 'medium'
          });
          summary = await summarizer.summarize(meta.text);
          await summarizer.destroy();
        } else if (aiCapabilities.prompt && chrome.ai) {
          const session = await chrome.ai.createTextSession();
          const prompt = `Summarize this web page in 2-3 key points:

Title: ${meta.title}
Content: ${meta.text.slice(0, 3000)}

Key points:`;
          summary = await session.prompt(prompt);
          await session.destroy();
        } else {
          throw new Error("Summarization not available");
        }

        sendResponse({ ok: true, summary, title: meta.title });
      } catch (err) {
        console.error('Summarization failed:', err);
        sendResponse({ ok: false, error: `Summarization failed: ${err.message}` });
      }

    } else if (msg.type === 'organizeTab') {
      console.log('Received organizeTab message');
      try {
        if (!aiCapabilities.prompt || !chrome.ai) {
          throw new Error("AI organization not available.");
        }

        const session = await chrome.ai.createTextSession();
        const tabContext = Object.entries(tabMeta)
          .map(([id, meta]) => `${id}: ${meta.title} (${new URL(meta.url).hostname})`)
          .join('\n');

        const prompt = `Analyze these browser tabs and suggest how to organize them into logical groups:

${tabContext}

Suggest 3-5 groups with descriptive names and which tab IDs belong in each group. Format as JSON:
{"groups": [{"name": "Group Name", "tabIds": [1,2,3]}]}`;

        const response = await session.prompt(prompt);
        await session.destroy();
        
        try {
          const suggestions = JSON.parse(response);
          sendResponse({ ok: true, suggestions });
        } catch {
          sendResponse({ ok: true, suggestions: { groups: [] }, rawResponse: response });
        }
      } catch (err) {
        console.error('Tab organization failed:', err);
        sendResponse({ ok: false, error: `Organization failed: ${err.message}` });
      }

    } else if (msg.type === 'getAiCapabilities') {
      sendResponse({ ok: true, capabilities: aiCapabilities });

    } else if (msg.type === 'search') {
      console.log('Received search message:', msg.query);
      // --- Hackathon Suggestion: Replace Server Call with Built-in Prompt API ---
      try {
         if (!chrome.ai) { throw new Error("Built-in AI API not available."); }

         const session = await chrome.ai.createTextSession();
         // Prepare context about open tabs
         const tabContext = Object.entries(tabMeta)
           .map(([id, meta]) => `Tab ID ${id}: "${meta.title}" (${meta.url}) - Snippet: ${meta.text?.slice(0, 100)}...`)
           .join('\n');

         const prompt = `Given the following open tabs:\n${tabContext}\n\nWhich tab best matches the query: "${msg.query}"?\nRespond ONLY with the Tab ID number of the best match, or "NONE" if no good match is found.`;

         const response = await session.prompt(prompt);
         await session.destroy();

         console.log('AI Find Response:', response);
         const foundIdStr = response.trim();

         if (foundIdStr !== "NONE" && /^\d+$/.test(foundIdStr)) {
            const foundId = parseInt(foundIdStr, 10);
            const targetTab = await chrome.tabs.get(foundId).catch(() => null); // Verify tab still exists

            if (targetTab) {
              console.log(`AI found match: Tab ID ${foundId}. Activating.`);
              await chrome.tabs.update(foundId, { active: true });
              if (targetTab.windowId) {
                 await chrome.windows.update(targetTab.windowId, { focused: true });
              }
              sendResponse({ ok: true, found: true, tabId: foundId });
            } else {
              console.log(`AI suggested tab ${foundId}, but it no longer exists.`);
              sendResponse({ ok: true, found: false, message: "AI suggested a tab, but it might have been closed." });
            }
         } else {
           console.log('AI found no matching tab.');
           sendResponse({ ok: true, found: false, message: "AI couldn't find a matching tab." });
         }

      } catch (err) {
        console.error('AI Find call failed', err);
        sendResponse({ ok: false, error: `AI search failed: ${err.message}` });
      }
      // ----------------------------------------------------------------------

    } else if (msg.type === 'reopenTab') {
      console.log('Received reopenTab message:', msg.query);
      // --- Suggestion: Use chrome.sessions API for more robust recently closed tabs ---
      /*
      chrome.sessions.getRecentlyClosed({ maxResults: 20 }, (sessions) => {
          if (chrome.runtime.lastError) {
              console.error("Error getting sessions:", chrome.runtime.lastError);
              sendResponse({ ok: false, error: 'Could not retrieve recently closed tabs.' });
              return;
          }
          let match = null;
          const q = msg.query ? msg.query.toLowerCase() : null;

          for (const session of sessions) {
              const item = session.tab || session.window; // Handle closed tabs or windows
              if (!item || !item.url || item.url.startsWith('chrome://')) continue; // Skip invalid or internal

              if (!q) { // If no query, reopen the most recent valid one
                  match = item;
                  break;
              }
              // Check if title or URL matches query
              if ((item.title && item.title.toLowerCase().includes(q)) || (item.url.toLowerCase().includes(q))) {
                  match = item;
                  break;
              }
          }

          if (match && match.sessionId) { // Need sessionId to restore
              chrome.sessions.restore(match.sessionId, () => {
                   sendResponse({ ok: true, reopened: { title: match.title, url: match.url } });
              });
          } else if (match && match.url && !match.sessionId) { // Fallback for simple tabs without session ID? (less common)
              chrome.tabs.create({ url: match.url }, () => sendResponse({ ok: true, reopened: match }));
          } else {
              sendResponse({ ok: false, error: 'No matching closed tab found in session history.' });
          }
      });
      */
      // --- Using existing storage method (simpler but less robust) ---
      const closed = recentlyClosed || []; // Use in-memory cache, already loaded from storage
      let match = null;
      if (msg.query) {
        const q = msg.query.toLowerCase();
        match = closed.find(t => (t.title && t.title.toLowerCase().includes(q)) || (t.url && t.url.toLowerCase().includes(q)));
      } else {
        match = closed[0]; // default: most recent from our list
      }
      if (match) {
        console.log(`Reopening tab: ${match.title}`);
        chrome.tabs.create({ url: match.url }, (newTab) => {
            if (chrome.runtime.lastError) {
                console.error("Error reopening tab:", chrome.runtime.lastError);
                sendResponse({ ok: false, error: `Failed to reopen tab: ${chrome.runtime.lastError.message}` });
            } else {
                sendResponse({ ok: true, reopened: match });
            }
        });
      } else {
        sendResponse({ ok: false, error: 'No matching closed tab found in recent list.' });
      }
      // -----------------------------------------------------------

    } else if (msg.type === 'openLastOpenedTab') {
      console.log('Received openLastOpenedTab message');
      // Use the potentially updated lastOpenedTabInfo from memory
      const lastTab = lastOpenedTabInfo;
      if (lastTab && lastTab.url) {
        console.log(`Opening last tracked opened tab: ${lastTab.title}`);
        chrome.tabs.create({ url: lastTab.url }, (newTab) => {
             if (chrome.runtime.lastError) {
                console.error("Error opening last tab:", chrome.runtime.lastError);
                sendResponse({ ok: false, error: `Failed to open last tab: ${chrome.runtime.lastError.message}` });
            } else {
                sendResponse({ ok: true, opened: lastTab });
            }
        });
      } else {
        sendResponse({ ok: false, error: 'No last opened tab found.' });
      }

    } else if (msg.type === 'listSummaries') {
       console.log('Received listSummaries message');
       // Example: Fetch items starting with 'summary-' prefix
       chrome.storage.local.get(null, items => {
           const summaries = Object.entries(items)
                               .filter(([key, value]) => key.startsWith('summary-')) // Adjust prefix if needed
                               .map(([key, value]) => value);
           sendResponse({ ok: true, items: summaries });
       });
    } else {
       console.log('Received unknown message type:', msg.type);
       sendResponse({ ok: false, error: `Unknown message type: ${msg.type}` }); // Respond for unknown types
    }
  })(); // Immediately invoke async function
  return true; // Indicate async response for all handlers that might be async
});

console.log("Tabby background service worker started."); // Log startup