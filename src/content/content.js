// This script will be injected into all pages
console.log('AI-Driven UserScript Manager content script loaded');

// 创建一个安全的脚本执行环境
function createScriptExecutor() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('scriptExecutor.js');
    script.onload = () => {
      console.log('Script executor loaded successfully');
      resolve();
    };
    script.onerror = (error) => {
      console.error('Failed to load script executor:', error);
      reject(error);
    };
    (document.head || document.documentElement).appendChild(script);
  });
}

// 在页面加载时创建执行器
createScriptExecutor().then(() => {
  console.log('Script executor created successfully');
}).catch(error => {
  console.error('Error creating script executor:', error);
});

// 监听来自背景脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'executeScript') {
    console.log('Received request to execute script:', request.code);
    
    window.postMessage({ type: 'EXECUTE_AI_SCRIPT', code: request.code }, '*');
    
    // 由于无法直接知道脚本执行的结果，我们假设它成功执行了
    sendResponse({ success: true });
  }
  return true; // 保持消息通道开放以进行异步响应
});
