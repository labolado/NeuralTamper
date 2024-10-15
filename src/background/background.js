console.log('Background script loaded');

import ScriptManager from './scriptManager';
import AIService from './aiService';

console.log('Modules imported');

const scriptManager = new ScriptManager();
const aiService = new AIService();

console.log('ScriptManager and AIService instances created');

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
      console.log('Loaded global AI settings:', globalAISettings);
    } else {
      chrome.storage.sync.set({ globalAISettings });
      console.log('Set default global AI settings:', globalAISettings);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log(`Tab update detected: ${tabId}, status: ${changeInfo.status}, url: ${tab.url}`);
  if (changeInfo.status === 'complete') {
    console.log(`Tab loading complete: ${tab.url}`);
    
    if (tab.url.startsWith('chrome://')) {
      console.log('Skipping chrome:// URL');
      return;
    }

    console.log('Attempting to get page HTML...');
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => document.documentElement.outerHTML,
    }).then(async results => {
      if (chrome.runtime.lastError) {
        console.error('Error getting page HTML:', JSON.stringify(chrome.runtime.lastError));
        return;
      }
      if (!results || results.length === 0) {
        console.error('No results returned from executeScript');
        return;
      }
      const pageHTML = results[0].result;
      console.log('Page HTML retrieved successfully. Length:', pageHTML.length);
      console.log('Executing matching scripts...');
      
      try {
        await aiService.initialize();
        const scripts = await scriptManager.loadScripts();
        console.log('Loaded scripts:', scripts);
        await scriptManager.executeMatchingScripts(tabId, tab.url, pageHTML, globalAISettings);
      } catch (error) {
        console.error('Error in script execution:', error.message, error.stack);
      }
    }).catch(error => {
      console.error('Error in script execution:', error.message, error.stack);
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'updateAISettings':
      handleUpdateAISettings(request, sendResponse);
      break;
    case 'getAISettings':
      handleGetAISettings(sendResponse);
      break;
    case 'addScript':
      handleAddScript(request, sendResponse);
      break;
    case 'updateScript':
      handleUpdateScript(request, sendResponse);
      break;
    case 'deleteScript':
      handleDeleteScript(request, sendResponse);
      break;
    case 'toggleScript':
      handleToggleScript(request, sendResponse);
      break;
    case 'generateAndApplyScript':
      handleGenerateAndApplyScript(request, sendResponse);
      break;
    case 'executePromptScript':
      handleExecutePromptScript(request, sendResponse);
      break;
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
  return true; // Indicates that the response is sent asynchronously
});

function handleUpdateAISettings(request, sendResponse) {
  globalAISettings = request.settings;
  aiService.updateSettings(request.settings.apiKey, request.settings.baseUrl);
  chrome.storage.sync.set({ globalAISettings }, () => {
    sendResponse({ success: true });
  });
}

function handleGetAISettings(sendResponse) {
  sendResponse({ success: true, settings: globalAISettings });
}

function handleAddScript(request, sendResponse) {
  scriptManager.addScript(request.script)
    .then(() => sendResponse({ success: true }))
    .catch(error => sendResponse({ success: false, error: error.message }));
}

function handleUpdateScript(request, sendResponse) {
  scriptManager.updateScript(request.index, request.script)
    .then(() => sendResponse({ success: true }))
    .catch(error => sendResponse({ success: false, error: error.message }));
}

function handleDeleteScript(request, sendResponse) {
  scriptManager.deleteScript(request.index)
    .then(() => sendResponse({ success: true }))
    .catch(error => sendResponse({ success: false, error: error.message }));
}

function handleToggleScript(request, sendResponse) {
  scriptManager.toggleScript(request.index, request.enabled)
    .then(() => sendResponse({ success: true }))
    .catch(error => sendResponse({ success: false, error: error.message }));
}

async function handleGenerateAndApplyScript(request, sendResponse) {
  try {
    const tab = await chrome.tabs.get(request.tabId);
    const [{ result: pageHTML }] = await chrome.scripting.executeScript({
      target: { tabId: request.tabId },
      func: () => document.documentElement.outerHTML,
    });

    const generatedCode = await aiService.generateScript(request.prompt, pageHTML, globalAISettings);

    await chrome.scripting.executeScript({
      target: { tabId: request.tabId },
      func: (code) => {
        try {
          eval(code);
        } catch (error) {
          console.error('Error executing generated script:', error);
        }
      },
      args: [generatedCode]
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('Error generating and applying script:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleExecutePromptScript(request, sendResponse) {
  try {
    console.log('Executing prompt script for tab:', request.tabId);
    const tab = await chrome.tabs.get(request.tabId);
    console.log('Got tab info:', tab.url);

    const [{ result: pageHTML }] = await chrome.scripting.executeScript({
      target: { tabId: request.tabId },
      func: () => document.documentElement.outerHTML,
    });
    console.log('Got page HTML, length:', pageHTML.length);

    // 创建一个临时脚本对象
    const tempScript = {
      name: 'Temporary Prompt Script',
      matchPattern: tab.url,
      code: request.prompt,
      enabled: true
    };

    console.log('Created temporary script:', tempScript);

    // 使用 executeMatchingScripts 方法来执行脚本
    await scriptManager.executeMatchingScripts(request.tabId, tab.url, pageHTML, globalAISettings, [tempScript]);
    console.log('Script execution completed');

    sendResponse({ success: true });
  } catch (error) {
    console.error('Error generating and applying script:', error);
    sendResponse({ success: false, error: error.message });
  }
}
