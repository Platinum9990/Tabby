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
      micBtn.textContent = '🎤';
    } else {
      recognition.start();
      isListening = true;
      micBtn.textContent = '👂';
    }
  });
}

if (recognition) {
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    addMessage(transcript, 'user');
    chatInput.value = '';
    micBtn.textContent = '🎤';
    isListening = false;
    // Send transcript as chat message
    chatSend.click();
    chatInput.value = transcript;
  };
  recognition.onerror = (event) => {
    isListening = false;
    micBtn.textContent = '🎤';
    alert(`Speech recognition error: ${event.error}`);
  };
  recognition.onend = () => {
    isListening = false;
    micBtn.textContent = '🎤';
  };
}
// Removed stray btnList reference
// TabSense AI popup.js — modern UI, open tabs list, chat interface

// Show open tabs with favicons, close buttons, active tab highlight
function renderTabs() {
  chrome.tabs.query({}, tabs => {
    const tabsList = document.getElementById('tabs-list');
    tabsList.innerHTML = '';
    chrome.tabs.query({active: true, currentWindow: true}, activeTabs => {
      const activeId = activeTabs[0]?.id;
      tabs.forEach(tab => {
        const item = document.createElement('div');
        item.className = 'tab-item' + (tab.id === activeId ? ' active' : '');
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
        tabsList.appendChild(item);
      });
    });
  });
}

renderTabs();
chrome.tabs.onUpdated.addListener(renderTabs);
chrome.tabs.onRemoved.addListener(renderTabs);
chrome.tabs.onActivated.addListener(renderTabs);

// Chat interface
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');


function addMessage(text, sender = 'user') {
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + sender;
  bubble.textContent = text;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatSend.addEventListener('click', () => {
  const text = chatInput.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  chatInput.value = '';
  // Check for reopen tab intent
  const reopenMatch = text.match(/reopen (my )?(last|previous|recent|.+) tab/i);
  if (reopenMatch) {
    // Try to extract tab name
    let query = '';
    if (reopenMatch[2] && !['last','previous','recent'].includes(reopenMatch[2].toLowerCase())) {
      query = reopenMatch[2];
    }
    chrome.runtime.sendMessage({ type: 'reopenTab', query }, res => {
      if (!res) { addMessage('No response from background.', 'ai'); return; }
      if (res.ok && res.reopened) {
        addMessage(`Reopened tab: ${res.reopened.title || res.reopened.url}`, 'ai');
      } else {
        addMessage('No matching closed tab found.', 'ai');
      }
    });
    return;
  }
  // Otherwise, normal search intent
  chrome.runtime.sendMessage({ type: 'search', query: text }, res => {
    if (!res) { addMessage('No response from background.', 'ai'); return; }
    if (!res.ok) { addMessage('Error: ' + res.error, 'ai'); return; }
    if (res.found) addMessage('Activated matching tab.', 'ai');
    else if (res.candidates && res.candidates.length)
      addMessage('No exact match. Candidates: ' + res.candidates.map(c=>c.title).join(', '), 'ai');
    else addMessage('No matching tab found.', 'ai');
  });
});

chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') chatSend.click();
});
