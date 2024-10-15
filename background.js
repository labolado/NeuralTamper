import { ScriptManager } from './lib/script-manager.js';
import { AIService } from './lib/ai-service.js';

const scriptManager = new ScriptManager();
const aiService = new AIService();

let globalAISettings = {
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
};

chrome.runtime.onInstalled.addListener(async () => {
  console.log('AI-Driven UserScript Manager installed');
  await aiService.initialize();
  
  chrome.storage.sync.get('globalAISettings', (result) => {
    if (result.globalAISettings) {
      globalAISettings = result.globalAISettings;
    } else {
      chrome.storage.sync.set({ globalAISettings });
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    executeMatchingScripts(tabId, tab.url);
  }
});

function executeMatchingScripts(tabId, url) {
  chrome.storage.local.get('scripts', (result) => {
    const scripts = result.scripts || [];
    const matchingScripts = scripts.filter(script => {
      if (!script.enabled) return false;
      try {
        const pattern = script.matchPattern
          .replace(/\*/g, '.*')
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`^${pattern}$`, 'i');
        return regex.test(url);
      } catch (error) {
        console.error('Invalid match pattern:', script.matchPattern, error);
        return false;
      }
    });

    matchingScripts.forEach(script => {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: executeScript,
        args: [script.code]
      });
    });
  });
}

function executeScript(code) {
  try {
    const safeFunction = new Function(code);
    safeFunction();
  } catch (error) {
    console.error('Error executing script:', error);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateScript') {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: getPageHTML,
      }, (results) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          const pageHTML = results[0].result;
          aiService.generateScript(request.prompt, pageHTML, globalAISettings)
            .then(script => {
              sendResponse({ success: true, script: script });
            })
            .catch(error => {
              sendResponse({ success: false, error: error.message });
            });
        }
      });
    });
    return true;
  } else if (request.action === 'updateAISettings') {
    globalAISettings = request.settings;
    chrome.storage.sync.set({ globalAISettings }, () => {
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === 'getAISettings') {
    sendResponse({ success: true, settings: globalAISettings });
    return false;
  }
});

function getPageHTML() {
  return document.documentElement.outerHTML;
}
