console.log('executor.js loaded');

function executeAIScript(code, pageHTML) {
    console.log('Executing AI script');
    try {
        // 创建一个新的函数，将 pageHTML 作为参数传递
        const scriptFunction = new Function('pageHTML', code);
        // 执行函数，传入 pageHTML
        scriptFunction(pageHTML);
        console.log('AI script executed successfully');
    } catch (error) {
        console.error('Error executing AI script:', error);
    }
}

window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    if (event.data.type && event.data.type === 'EXECUTE_AI_SCRIPT') {
        executeAIScript(event.data.code, event.data.pageHTML);
    }
}, false);

console.log('window.executeAIScript function defined');
