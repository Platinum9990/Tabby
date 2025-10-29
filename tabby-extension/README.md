Tabby — AI Tab Manager (Prototype)

This prototype contains a Chrome extension and a small Node.js server that mocks AI endpoints (find/summarize).

Quick start (Windows PowerShell):

# 1. Install server deps and start the server
cd "c:\Users\TVEE RENEWED HOPE\Downloads\t\tabby-extension\server"; npm install; npm start

# 2. Load extension in Chrome
- Open chrome://extensions
- Enable Developer mode
- Load unpacked and point to the `tabby-extension` folder

Notes:
- This is a minimal prototype. The server contains mocked endpoints. Replace with real AI API calls.
- The background service worker schedules idle summarization after 1 minute (for demo). Adjust in `background.js`.
