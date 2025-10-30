// Draggable persistent window logic
const dragHeader = document.getElementById('draggable-header');
if (window.top === window.self && dragHeader) {
  let isDragging = false, startX = 0, startY = 0, winX = 0, winY = 0;
  dragHeader.addEventListener('mousedown', e => {
    isDragging = true;
    startX = e.screenX;
    startY = e.screenY;
    chrome.windows.getCurrent(win => {
      winX = win.left;
      winY = win.top;
    });
    document.body.style.cursor = 'move';
  });
  window.addEventListener('mousemove', e => {
    if (isDragging) {
      const dx = e.screenX - startX;
      const dy = e.screenY - startY;
      chrome.windows.getCurrent(win => {
        chrome.windows.update(win.id, { left: winX + dx, top: winY + dy });
      });
    }
  });
  window.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.cursor = '';
  });
}
// Voice input (Web Speech API)
const micBtn = document.getElementById('microphone-button');
let isListening = false;
let recognition;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
}

if (micBtn) {
  micBtn.addEventListener('click', () => {
    if (!recognition) {
      alert("Sorry, your browser doesn't support voice input.");
      return;
    }
    if (isListening) {
      recognition.stop();
      isListening = false;
      micBtn.classList.remove('recording');
    } else {
      recognition.start();
      isListening = true;
      micBtn.classList.add('recording');
    }
  });
}

if (recognition) {
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    addMessage(transcript, 'user');
    chatInput.value = '';
    micBtn.classList.remove('recording');
    isListening = false;
    // Send transcript as chat message
    chatSend.click();
    chatInput.value = transcript;
  };
  recognition.onerror = (event) => {
    isListening = false;
    micBtn.classList.remove('recording');
    alert(`Speech recognition error: ${event.error}`);
  };
  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove('recording');
  };
}
// Removed stray btnList reference
// TabSense AI popup.js — modern UI, open tabs list, chat interface

// Collapsible sections functionality
function initCollapsibleSections() {
  const tabsCollapseBtn = document.getElementById('tabs-collapse');
  const chatCollapseBtn = document.getElementById('chat-collapse');
  const tabsContent = document.querySelector('.tabs-section .collapsible-content');
  const chatContent = document.querySelector('.chat-section .collapsible-content');

  // Load saved states from storage
  chrome.storage.local.get(['tabsCollapsed', 'chatCollapsed'], (result) => {
    if (result.tabsCollapsed) {
      tabsContent.classList.add('collapsed');
      tabsCollapseBtn.classList.add('collapsed');
    }
    if (result.chatCollapsed) {
      chatContent.classList.add('collapsed');
      chatCollapseBtn.classList.add('collapsed');
    }
  });

  tabsCollapseBtn.addEventListener('click', () => {
    const isCollapsed = tabsContent.classList.toggle('collapsed');
    tabsCollapseBtn.classList.toggle('collapsed');
    chrome.storage.local.set({ tabsCollapsed: isCollapsed });
  });

  chatCollapseBtn.addEventListener('click', () => {
    const isCollapsed = chatContent.classList.toggle('collapsed');
    chatCollapseBtn.classList.toggle('collapsed');
    chrome.storage.local.set({ chatCollapsed: isCollapsed });
  });
}

// Initialize collapsible sections
initCollapsibleSections();

// Theme toggle functionality
function initThemeToggle() {
  const themeBtn = document.getElementById('theme-toggle');
  
  // Load saved theme
  chrome.storage.local.get(['theme'], (result) => {
    const theme = result.theme || 'dark';
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    }
  });
  
  themeBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    const theme = isLight ? 'light' : 'dark';
    chrome.storage.local.set({ theme });
    
    // Update icon
    const icon = themeBtn.querySelector('svg');
    if (isLight) {
      icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" fill="none"/>`;
    } else {
      icon.innerHTML = `<path d="M12 3V1M12 23V21M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" fill="none"/>`;
    }
  });
}

initThemeToggle();

// Show open tabs with favicons, close buttons, active tab highlight
let allTabs = [];

function renderTabs(searchQuery = '') {
  chrome.tabs.query({}, tabs => {
    allTabs = tabs;
    const tabsContainer = document.getElementById('tabs-container');
    tabsContainer.innerHTML = '';
    chrome.tabs.query({active: true, currentWindow: true}, activeTabs => {
      const activeId = activeTabs[0]?.id;
      
      // Filter tabs based on search query
      const filteredTabs = tabs.filter(tab => 
        !searchQuery || 
        tab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tab.url.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      filteredTabs.forEach(tab => {
        const item = document.createElement('div');
        let className = 'tab-item';
        if (tab.id === activeId) className += ' active';
        if (tab.pinned) className += ' pinned';
        if (tab.audible) className += ' audible';
        if (tab.status === 'loading') className += ' loading';
        item.className = className;
        
        // Favicon
        const fav = document.createElement('img');
        fav.className = 'tab-favicon';
        fav.src = tab.favIconUrl || 'assets/icon16.png';
        item.appendChild(fav);
        
        // Title
        const title = document.createElement('div');
        title.className = 'tab-title';
        title.textContent = tab.title || tab.url;
        item.appendChild(title);
        
        // Status indicators
        const indicators = document.createElement('div');
        indicators.className = 'tab-indicators';
        if (tab.pinned) {
          const pin = document.createElement('span');
          pin.textContent = '📌';
          pin.title = 'Pinned';
          indicators.appendChild(pin);
        }
        if (tab.audible) {
          const audio = document.createElement('span');
          audio.textContent = '🔊';
          audio.title = 'Playing audio';
          indicators.appendChild(audio);
        }
        item.appendChild(indicators);
        
        // Close button
        const close = document.createElement('button');
        close.className = 'tab-close';
        close.innerHTML = '✕';
        close.onclick = e => {
          e.stopPropagation();
          chrome.tabs.remove(tab.id);
          item.style.opacity = '0.5';
        };
        item.appendChild(close);
        
        // Activate tab on click
        item.onclick = e => {
          if (tab.id !== activeId) chrome.tabs.update(tab.id, { active: true });
        };
        
        tabsContainer.appendChild(item);
      });
    });
  });
}

// Initialize tab search
function initTabSearch() {
  const tabSearch = document.getElementById('tab-search');
  const closeAllBtn = document.getElementById('close-all-tabs');
  const summarizeBtn = document.getElementById('summarize-current');
  const organizeBtn = document.getElementById('organize-tabs');
  
  tabSearch.addEventListener('input', (e) => {
    renderTabs(e.target.value);
  });
  
  closeAllBtn.addEventListener('click', () => {
    if (confirm('Close all tabs except this one?')) {
      chrome.tabs.query({active: true, currentWindow: true}, activeTabs => {
        const activeId = activeTabs[0]?.id;
        allTabs.forEach(tab => {
          if (tab.id !== activeId) {
            chrome.tabs.remove(tab.id);
          }
        });
      });
    }
  });

  // AI-powered summarize current tab
  summarizeBtn.addEventListener('click', () => {
    showTypingIndicator();
    chrome.runtime.sendMessage({ type: 'summarizeTab' }, res => {
      hideTypingIndicator();
      if (res && res.ok) {
        addMessage(`📄 Summary of "${res.title}":\n\n${res.summary}`, 'ai');
      } else {
        addMessage(`❌ ${res?.error || 'Could not summarize current tab'}`, 'ai');
      }
    });
  });

  // AI-powered tab organization
  organizeBtn.addEventListener('click', () => {
    showTypingIndicator();
    chrome.runtime.sendMessage({ type: 'organizeTab' }, res => {
      hideTypingIndicator();
      if (res && res.ok && res.suggestions.groups) {
        let response = '📁 AI suggests these tab groups:\n\n';
        res.suggestions.groups.forEach((group, i) => {
          response += `${i + 1}. **${group.name}**\n`;
          if (group.tabIds && group.tabIds.length > 0) {
            response += `   Tabs: ${group.tabIds.join(', ')}\n`;
          }
          response += '\n';
        });
        addMessage(response, 'ai');
      } else {
        addMessage(`🤔 ${res?.error || 'Could not analyze tabs for organization'}`, 'ai');
      }
    });
  });
}

initTabSearch();

renderTabs();
chrome.tabs.onUpdated.addListener(renderTabs);
chrome.tabs.onRemoved.addListener(renderTabs);
chrome.tabs.onActivated.addListener(renderTabs);

// Chat interface
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');

function addMessage(text, sender = 'user', timestamp = new Date()) {
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + sender;
  
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  messageContent.textContent = text;
  
  const messageTime = document.createElement('div');
  messageTime.className = 'message-time';
  messageTime.textContent = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  bubble.appendChild(messageContent);
  bubble.appendChild(messageTime);
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Save to chat history
  saveChatHistory(text, sender, timestamp);
}

function showTypingIndicator() {
  const existingIndicator = document.querySelector('.typing-indicator');
  if (existingIndicator) return;
  
  const indicator = document.createElement('div');
  indicator.className = 'chat-bubble ai typing-indicator';
  indicator.innerHTML = `
    <div class="typing-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  chatMessages.appendChild(indicator);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
  const indicator = document.querySelector('.typing-indicator');
  if (indicator) indicator.remove();
}

function saveChatHistory(text, sender, timestamp) {
  chrome.storage.local.get(['chatHistory'], (result) => {
    const history = result.chatHistory || [];
    history.push({ text, sender, timestamp: timestamp.toISOString() });
    // Keep only last 50 messages
    if (history.length > 50) history.shift();
    chrome.storage.local.set({ chatHistory: history });
  });
}

function loadChatHistory() {
  chrome.storage.local.get(['chatHistory'], (result) => {
    const history = result.chatHistory || [];
    history.forEach(msg => {
      addMessageWithoutSaving(msg.text, msg.sender, new Date(msg.timestamp));
    });
  });
}

function addMessageWithoutSaving(text, sender, timestamp) {
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + sender;
  
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  messageContent.textContent = text;
  
  const messageTime = document.createElement('div');
  messageTime.className = 'message-time';
  messageTime.textContent = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  bubble.appendChild(messageContent);
  bubble.appendChild(messageTime);
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Load chat history on startup
loadChatHistory();

// Show AI capabilities on startup
chrome.runtime.sendMessage({ type: 'getAiCapabilities' }, res => {
  if (res && res.ok) {
    const capabilities = res.capabilities;
    const availableFeatures = [];
    
    if (capabilities.prompt) availableFeatures.push('💬 Intelligent chat');
    if (capabilities.summarizer) availableFeatures.push('📄 Tab summarization');
    if (capabilities.writer) availableFeatures.push('✍️ Content generation');
    if (capabilities.rewriter) availableFeatures.push('🔄 Text improvement');
    if (capabilities.translator) availableFeatures.push('🌐 Translation');
    
    if (availableFeatures.length > 0) {
      addMessageWithoutSaving(
        `🤖 Tabby AI is ready! Available features:\n\n${availableFeatures.join('\n')}\n\nTry saying: "summarize this tab" or "organize my tabs"`, 
        'ai', 
        new Date()
      );
    } else {
      addMessageWithoutSaving(
        '🤖 Hi! I\'m Tabby, your browsing assistant. Try commands like "find tab about..." or "reopen my last tab"',
        'ai',
        new Date()
      );
    }
  }
});

chatSend.addEventListener('click', () => {
  const text = chatInput.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  chatInput.value = '';
  
  // Show typing indicator
  showTypingIndicator();
  
  // Enhanced AI command processing
  if (text.toLowerCase().includes('summarize') || text.toLowerCase().includes('summary')) {
    // Summarize current or specified tab
    chrome.runtime.sendMessage({ type: 'summarizeTab' }, res => {
      hideTypingIndicator();
      if (res && res.ok) {
        addMessage(`📄 Summary of "${res.title}":\n\n${res.summary}`, 'ai');
      } else {
        addMessage(`❌ ${res?.error || 'Could not summarize tab'}`, 'ai');
      }
    });
    return;
  }
  
  if (text.toLowerCase().includes('organize') || text.toLowerCase().includes('group')) {
    // Organize tabs intelligently
    chrome.runtime.sendMessage({ type: 'organizeTab' }, res => {
      hideTypingIndicator();
      if (res && res.ok && res.suggestions.groups) {
        let response = '📁 Here are some suggested tab groups:\n\n';
        res.suggestions.groups.forEach((group, i) => {
          response += `${i + 1}. **${group.name}**\n`;
          if (group.tabIds && group.tabIds.length > 0) {
            response += `   Tabs: ${group.tabIds.join(', ')}\n`;
          }
          response += '\n';
        });
        addMessage(response, 'ai');
      } else {
        addMessage(`🤔 ${res?.error || 'Could not organize tabs'}`, 'ai');
      }
    });
    return;
  }
  
  // Check for reopen tab intent
  const reopenMatch = text.match(/reopen (my )?(last|previous|recent|.+) tab/i);
  if (reopenMatch) {
    // Try to extract tab name
    let query = '';
    if (reopenMatch[2] && !['last','previous','recent'].includes(reopenMatch[2].toLowerCase())) {
      query = reopenMatch[2];
    }
    chrome.runtime.sendMessage({ type: 'reopenTab', query }, res => {
      hideTypingIndicator();
      if (!res) { 
        addMessage('No response from background.', 'ai'); 
        return; 
      }
      if (res.ok && res.reopened) {
        addMessage(`✅ Reopened tab: ${res.reopened.title || res.reopened.url}`, 'ai');
      } else {
        addMessage('❌ No matching closed tab found.', 'ai');
      }
    });
    return;
  }
  
  // Check for tab search intent
  if (text.toLowerCase().includes('find') || text.toLowerCase().includes('switch') || text.toLowerCase().includes('open')) {
    chrome.runtime.sendMessage({ type: 'search', query: text }, res => {
      hideTypingIndicator();
      if (!res) { 
        addMessage('No response from background.', 'ai'); 
        return; 
      }
      if (!res.ok) { 
        addMessage(`❌ Error: ${res.error}`, 'ai'); 
        return; 
      }
      if (res.found) {
        addMessage('✅ Found and activated matching tab!', 'ai');
      } else if (res.candidates && res.candidates.length) {
        addMessage(`🔍 No exact match. Similar tabs: ${res.candidates.map(c=>c.title).join(', ')}`, 'ai');
      } else {
        addMessage('❌ No matching tab found.', 'ai');
      }
    });
    return;
  }
  
  // Default: AI chat for general questions
  chrome.runtime.sendMessage({ type: 'aiChat', query: text }, res => {
    hideTypingIndicator();
    if (res && res.ok) {
      addMessage(res.response, 'ai');
    } else {
      addMessage(`🤖 ${res?.error || 'AI chat temporarily unavailable'}`, 'ai');
    }
  });
});

chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') chatSend.click();
});
