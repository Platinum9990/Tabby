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
    if (typeof chrome !== 'undefined' && chrome.ai) {
      // Check Prompt API
      if (chrome.ai.canCreateTextSession) {
        try {
          const availability = await chrome.ai.canCreateTextSession();
          aiCapabilities.prompt = availability === 'readily';
        } catch (e) {
          console.log('Prompt API not available:', e.message);
        }
      }
      
      // Check Summarizer API
      if (chrome.ai.summarizer && chrome.ai.summarizer.capabilities) {
        try {
          const sumCapabilities = await chrome.ai.summarizer.capabilities();
          aiCapabilities.summarizer = sumCapabilities.available === 'readily';
        } catch (e) {
          console.log('Summarizer API not available:', e.message);
        }
      }
      
      // Check Writer API
      if (chrome.ai.writer && chrome.ai.writer.capabilities) {
        try {
          const writerCapabilities = await chrome.ai.writer.capabilities();
          aiCapabilities.writer = writerCapabilities.available === 'readily';
        } catch (e) {
          console.log('Writer API not available:', e.message);
        }
      }
      
      // Check Rewriter API
      if (chrome.ai.rewriter && chrome.ai.rewriter.capabilities) {
        try {
          const rewriterCapabilities = await chrome.ai.rewriter.capabilities();
          aiCapabilities.rewriter = rewriterCapabilities.available === 'readily';
        } catch (e) {
          console.log('Rewriter API not available:', e.message);
        }
      }
      
      // Check Translator API
      if (chrome.ai.translator && chrome.ai.translator.capabilities) {
        try {
          const translatorCapabilities = await chrome.ai.translator.capabilities();
          aiCapabilities.translator = translatorCapabilities.available === 'readily';
        } catch (e) {
          console.log('Translator API not available:', e.message);
        }
      }
      
      console.log('AI Capabilities initialized:', aiCapabilities);
    } else {
      console.log('Chrome AI APIs not available in this version. Using fallback functionality.');
    }
  } catch (error) {
    console.warn('Error initializing AI capabilities:', error);
  }
}

// Initialize AI on startup
initializeAI();

// Smart content extraction without AI APIs
function extractKeyInfo(text, url) {
  if (!text) return "No content available to summarize.";
  
  const domain = new URL(url).hostname;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // Get first few sentences and key information
  const keyPoints = [];
  
  // Add domain context
  if (domain.includes('github')) {
    keyPoints.push(`📂 GitHub repository: ${extractProjectInfo(text)}`);
  } else if (domain.includes('stackoverflow')) {
    keyPoints.push(`❓ Programming Q&A: ${extractQuestionInfo(text)}`);
  } else if (domain.includes('news') || domain.includes('article')) {
    keyPoints.push(`📰 News article: ${extractNewsInfo(text)}`);
  } else {
    keyPoints.push(`🌐 Website content from ${domain}`);
  }
  
  // Add key sentences (first 2-3 meaningful ones)
  const meaningfulSentences = sentences
    .filter(s => !s.includes('cookie') && !s.includes('privacy') && s.length > 30)
    .slice(0, 3);
    
  keyPoints.push(...meaningfulSentences.map(s => `• ${s.trim()}`));
  
  return keyPoints.join('\n');
}

function extractProjectInfo(text) {
  // Look for README-style content
  if (text.includes('installation') || text.includes('install')) {
    return "Contains installation instructions";
  }
  if (text.includes('API') || text.includes('documentation')) {
    return "API or documentation content";
  }
  return "Code repository";
}

function extractQuestionInfo(text) {
  if (text.includes('answered') || text.includes('solution')) {
    return "Question with answers available";
  }
  return "Programming question/discussion";
}

function extractNewsInfo(text) {
  const sentences = text.split('.').filter(s => s.length > 50);
  return sentences[0]?.slice(0, 100) + "..." || "News content";
}

function generateBasicSummary(tab) {
  const domain = new URL(tab.url).hostname;
  const title = tab.title || 'Untitled page';
  
  let summary = `📄 **${title}**\n🌐 From: ${domain}\n`;
  
  // Add context based on domain
  if (domain.includes('gmail')) summary += '📧 Gmail inbox or email';
  else if (domain.includes('youtube')) summary += '🎥 YouTube video or channel';
  else if (domain.includes('github')) summary += '💻 GitHub repository or code';
  else if (domain.includes('docs.google')) summary += '📝 Google Docs document';
  else if (domain.includes('stackoverflow')) summary += '❓ Programming Q&A';
  else if (domain.includes('linkedin')) summary += '💼 LinkedIn professional content';
  else if (domain.includes('twitter')) summary += '🐦 Twitter/X social content';
  else summary += '🌐 Web page content';
  
  return summary;
}

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
        
        if (!tabId) {
          sendResponse({ ok: false, error: "No tab to summarize." });
          return;
        }
        
        // Get current tab info
        const tab = await chrome.tabs.get(tabId);
        let summary = '';
        
        // Try AI first, then fallback to smart extraction
        if (aiCapabilities.summarizer && chrome.ai.summarizer) {
          const meta = tabMeta[tabId];
          if (meta && meta.text) {
            const summarizer = await chrome.ai.summarizer.create({
              type: 'key-points',
              format: 'plain-text',
              length: 'medium'
            });
            summary = await summarizer.summarize(meta.text);
            await summarizer.destroy();
          }
        } else {
          // Smart extraction without AI
          const meta = tabMeta[tabId];
          if (meta && meta.text) {
            summary = extractKeyInfo(meta.text, tab.url);
          } else {
            // Extract basic info from tab
            summary = generateBasicSummary(tab);
          }
        }
        
        sendResponse({ ok: true, summary, title: tab.title, url: tab.url });
      } catch (err) {
        console.error('Summarization failed:', err);
        sendResponse({ ok: false, error: `Summarization failed: ${err.message}` });
      }

    } else if (msg.type === 'organizeTab') {
      console.log('Received organizeTab message');
      try {
        const tabs = await chrome.tabs.query({});
        
        if (aiCapabilities.prompt && chrome.ai) {
          // Use AI if available
          const session = await chrome.ai.createTextSession();
          const tabContext = tabs
            .map(tab => `${tab.id}: ${tab.title} (${new URL(tab.url).hostname})`)
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
        } else {
          // Smart organization without AI
          const groups = organizeTabsSmart(tabs);
          sendResponse({ ok: true, suggestions: { groups } });
        }
      } catch (err) {
        console.error('Tab organization failed:', err);
        sendResponse({ ok: false, error: `Organization failed: ${err.message}` });
      }

    } else if (msg.type === 'getAiCapabilities') {
      sendResponse({ ok: true, capabilities: aiCapabilities });

    } else if (msg.type === 'addToReadingList') {
      console.log('Received addToReadingList message:', msg.tabId);
      try {
        const tabId = msg.tabId || (await chrome.tabs.query({active: true, currentWindow: true}))[0]?.id;
        if (!tabId) {
          sendResponse({ ok: false, error: 'No active tab found' });
          return;
        }
        
        const tab = await chrome.tabs.get(tabId);
        
        // Check if Reading List API is available
        if (chrome.readingList && typeof chrome.readingList.addEntry === 'function') {
          try {
            await chrome.readingList.addEntry({
              title: tab.title,
              url: tab.url,
              hasBeenRead: false
            });
            sendResponse({ ok: true, message: `Added "${tab.title}" to Reading List` });
          } catch (apiError) {
            console.warn('Reading List API failed, using fallback:', apiError);
            // Fall through to local storage fallback
          }
        }
        
        // Fallback: save to local storage
        const readingList = await chrome.storage.local.get(['readingList']);
        const entries = readingList.readingList || [];
        
        // Check for duplicates
        const exists = entries.some(entry => entry.url === tab.url);
        if (exists) {
          sendResponse({ ok: true, message: `"${tab.title}" is already in your reading list` });
          return;
        }
        
        entries.unshift({
          title: tab.title,
          url: tab.url,
          addedAt: Date.now(),
          hasBeenRead: false,
          favicon: tab.favIconUrl
        });
        
        if (entries.length > 50) entries.pop(); // Limit to 50 items
        await chrome.storage.local.set({ readingList: entries });
        sendResponse({ ok: true, message: `Added "${tab.title}" to Reading List` });
        
      } catch (err) {
        console.error('Add to reading list failed:', err);
        sendResponse({ ok: false, error: `Failed to add to reading list: ${err.message}` });
      }

    } else if (msg.type === 'smartBookmark') {
      console.log('Received smartBookmark message:', msg.tabId);
      try {
        const tabId = msg.tabId || (await chrome.tabs.query({active: true, currentWindow: true}))[0]?.id;
        if (!tabId) {
          sendResponse({ ok: false, error: 'No active tab found' });
          return;
        }
        
        const tab = await chrome.tabs.get(tabId);
        
        if (chrome.bookmarks && typeof chrome.bookmarks.create === 'function') {
          // Find or create AI-organized folder
          const bookmarks = await chrome.bookmarks.search({title: "TabSense AI"});
          let folderId;
          
          if (bookmarks.length === 0) {
            const folder = await chrome.bookmarks.create({
              title: "TabSense AI",
              parentId: "1" // Bookmarks bar
            });
            folderId = folder.id;
          } else {
            folderId = bookmarks[0].id;
          }
          
          // Create category subfolder based on tab content
          const category = categorizeTab(tab, getDomain(tab.url));
          const categoryFolders = await chrome.bookmarks.search({title: category});
          let categoryFolderId = folderId;
          
          if (categoryFolders.length === 0) {
            const categoryFolder = await chrome.bookmarks.create({
              title: category,
              parentId: folderId
            });
            categoryFolderId = categoryFolder.id;
          } else {
            categoryFolderId = categoryFolders.find(f => f.parentId === folderId)?.id || folderId;
          }
          
          await chrome.bookmarks.create({
            title: tab.title,
            url: tab.url,
            parentId: categoryFolderId
          });
          
          sendResponse({ ok: true, message: `Bookmarked "${tab.title}" in ${category}`, folder: category });
        } else {
          sendResponse({ ok: false, error: 'Bookmarks API not available' });
        }
      } catch (err) {
        console.error('Smart bookmark failed:', err);
        sendResponse({ ok: false, error: `Bookmark failed: ${err.message}` });
      }

    } else if (msg.type === 'createTabGroup') {
      console.log('Received createTabGroup message:', msg.category);
      try {
        // Check if Tab Groups API is available
        if (!chrome.tabGroups || typeof chrome.tabs.group !== 'function') {
          sendResponse({ ok: false, error: 'Tab Groups API not available in this Chrome version' });
          return;
        }
        
        const tabs = await chrome.tabs.query({ currentWindow: true });
        
        // If specific category provided, filter by it
        if (msg.category) {
          const matchingTabs = tabs.filter(tab => {
            const tabCategory = categorizeTab(tab, getDomain(tab.url));
            return tabCategory === msg.category;
          });
          
          if (matchingTabs.length === 0) {
            sendResponse({ ok: false, error: `No tabs found for category: ${msg.category}` });
            return;
          }
          
          const tabIds = matchingTabs.map(tab => tab.id);
          const group = await chrome.tabs.group({ tabIds });
          
          const colors = ['blue', 'green', 'yellow', 'orange', 'red', 'purple', 'pink', 'cyan'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          
          await chrome.tabGroups.update(group, {
            title: `🤖 ${msg.category}`,
            color: color,
            collapsed: false
          });
          
          sendResponse({ 
            ok: true, 
            message: `Created group "${msg.category}" with ${tabIds.length} tabs`,
            groupId: group,
            tabCount: tabIds.length,
            groupTitle: msg.category
          });
          
        } else {
          // Auto-group by domain similarity
          const domainGroups = new Map();
          
          tabs.forEach(tab => {
            const domain = getDomain(tab.url);
            if (!domain || domain === 'unknown' || tab.url.startsWith('chrome://')) return;
            
            if (!domainGroups.has(domain)) {
              domainGroups.set(domain, []);
            }
            domainGroups.get(domain).push(tab.id);
          });
          
          // Find domains with multiple tabs
          const groupsToCreate = Array.from(domainGroups.entries())
            .filter(([domain, tabIds]) => tabIds.length > 1)
            .slice(0, 3); // Limit to 3 groups to avoid overwhelming
          
          if (groupsToCreate.length === 0) {
            sendResponse({ ok: false, error: 'No similar tabs found to group' });
            return;
          }
          
          let totalTabsGrouped = 0;
          const colors = ['blue', 'green', 'yellow', 'orange', 'red', 'purple', 'pink', 'cyan'];
          
          for (const [domain, tabIds] of groupsToCreate) {
            const group = await chrome.tabs.group({ tabIds });
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            await chrome.tabGroups.update(group, {
              title: `📁 ${domain}`,
              color: color,
              collapsed: false
            });
            
            totalTabsGrouped += tabIds.length;
          }
          
          sendResponse({ 
            ok: true, 
            message: `Created ${groupsToCreate.length} tab groups with ${totalTabsGrouped} tabs`,
            groupCount: groupsToCreate.length,
            tabCount: totalTabsGrouped,
            groupTitle: `${groupsToCreate.length} groups`
          });
        }
        
      } catch (err) {
        console.error('Create tab group failed:', err);
        sendResponse({ ok: false, error: `Tab grouping failed: ${err.message}` });
      }

    } else if (msg.type === 'search') {
      console.log('Received search message:', msg.query);
      try {
        // Smart tab finding without AI APIs - using pattern matching and keywords
        const query = msg.query.toLowerCase();
        const tabs = await chrome.tabs.query({});
        
        let bestMatch = null;
        let bestScore = 0;
        let candidates = [];
        
        for (const tab of tabs) {
          let score = 0;
          const title = (tab.title || '').toLowerCase();
          const url = (tab.url || '').toLowerCase();
          const domain = new URL(tab.url).hostname.toLowerCase();
          
          // Direct keyword matching
          if (title.includes(query) || url.includes(query)) {
            score += 10;
          }
          
          // Domain matching
          if (domain.includes(query)) {
            score += 8;
          }
          
          // Fuzzy matching for common terms
          const keywords = query.split(' ');
          keywords.forEach(keyword => {
            if (title.includes(keyword)) score += 3;
            if (url.includes(keyword)) score += 2;
            if (domain.includes(keyword)) score += 4;
          });
          
          // Common site patterns
          if (query.includes('mail') && (domain.includes('gmail') || domain.includes('outlook'))) score += 15;
          if (query.includes('video') && (domain.includes('youtube') || domain.includes('netflix'))) score += 15;
          if (query.includes('social') && (domain.includes('facebook') || domain.includes('twitter') || domain.includes('linkedin'))) score += 15;
          if (query.includes('code') && (domain.includes('github') || domain.includes('stackoverflow'))) score += 15;
          if (query.includes('doc') && (domain.includes('docs.google') || domain.includes('notion'))) score += 15;
          
          if (score > 0) {
            candidates.push({ tab, score, title: tab.title });
            if (score > bestScore) {
              bestScore = score;
              bestMatch = tab;
            }
          }
        }
        
        if (bestMatch && bestScore >= 3) {
          console.log(`Smart search found match: ${bestMatch.title} (score: ${bestScore})`);
          await chrome.tabs.update(bestMatch.id, { active: true });
          if (bestMatch.windowId) {
            await chrome.windows.update(bestMatch.windowId, { focused: true });
          }
          sendResponse({ ok: true, found: true, tabId: bestMatch.id, title: bestMatch.title });
        } else {
          console.log('Smart search found no good matches');
          const candidateList = candidates.slice(0, 3).map(c => ({ title: c.title, score: c.score }));
          sendResponse({ ok: true, found: false, candidates: candidateList, message: "No good match found." });
        }
        
      } catch (err) {
        console.error('Smart search failed:', err);
        sendResponse({ ok: false, error: `Search failed: ${err.message}` });
      }

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

// Smart tab organization without AI
function organizeTabsSmart(tabs) {
  const groups = new Map();
  
  tabs.forEach(tab => {
    const domain = getDomain(tab.url);
    const category = categorizeTab(tab, domain);
    
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category).push(tab.id);
  });
  
  // Convert to format expected by UI
  return Array.from(groups.entries()).map(([name, tabIds]) => ({
    name,
    tabIds
  }));
}

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

function categorizeTab(tab, domain) {
  const title = tab.title.toLowerCase();
  const url = tab.url.toLowerCase();
  
  // Work/Productivity
  if (domain.includes('google') && (url.includes('docs') || url.includes('sheets') || url.includes('slides'))) {
    return 'Work Documents';
  }
  if (['slack', 'teams', 'zoom', 'discord', 'skype'].some(w => domain.includes(w))) {
    return 'Communication';
  }
  if (['gmail', 'outlook', 'yahoo'].some(w => domain.includes(w)) || url.includes('mail')) {
    return 'Email';
  }
  
  // Development
  if (['github', 'gitlab', 'bitbucket', 'stackoverflow', 'codepen'].some(w => domain.includes(w))) {
    return 'Development';
  }
  if (['localhost', '127.0.0.1'].some(w => url.includes(w)) || /:\d{4}/.test(url)) {
    return 'Local Development';
  }
  
  // Social Media
  if (['facebook', 'twitter', 'instagram', 'linkedin', 'reddit', 'tiktok'].some(w => domain.includes(w))) {
    return 'Social Media';
  }
  
  // Shopping
  if (['amazon', 'ebay', 'etsy', 'aliexpress', 'shopify'].some(w => domain.includes(w)) || 
      title.includes('cart') || title.includes('checkout')) {
    return 'Shopping';
  }
  
  // News & Information
  if (['news', 'bbc', 'cnn', 'reuters', 'techcrunch', 'wired'].some(w => domain.includes(w))) {
    return 'News';
  }
  if (['wikipedia', 'wikimedia'].some(w => domain.includes(w))) {
    return 'Reference';
  }
  
  // Entertainment
  if (['youtube', 'netflix', 'spotify', 'twitch', 'hulu'].some(w => domain.includes(w))) {
    return 'Entertainment';
  }
  
  // Learning
  if (['coursera', 'udemy', 'khan', 'edx', 'pluralsight'].some(w => domain.includes(w))) {
    return 'Learning';
  }
  
  // Default grouping by domain
  const baseDomain = domain.split('.').slice(-2).join('.');
  return baseDomain.charAt(0).toUpperCase() + baseDomain.slice(1);
}

console.log("Tabby background service worker started."); // Log startup