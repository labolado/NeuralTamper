console.log('Script executor loaded');

window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    if (event.data.type && event.data.type === 'EXECUTE_AI_SCRIPT') {
        try {
            console.log('Executing AI generated script:', event.data.code);
            eval(event.data.code);
            console.log('AI generated script executed successfully');
        } catch (error) {
            console.error('Error executing AI generated script:', error);
        }
    }
}, false);
