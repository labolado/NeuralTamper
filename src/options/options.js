document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('aiSettings');
    const apiKeyInput = document.getElementById('apiKey');
    const baseUrlInput = document.getElementById('baseUrl');
    const modelInput = document.getElementById('model');
    const temperatureInput = document.getElementById('temperature');

    // Load current settings
    chrome.storage.sync.get(['apiKey', 'baseUrl', 'globalAISettings'], (result) => {
        console.log('Loaded settings:', result);
        apiKeyInput.value = result.apiKey || '';
        baseUrlInput.value = result.baseUrl || 'https://api.openai.com/v1/chat/completions';
        if (result.globalAISettings) {
            modelInput.value = result.globalAISettings.model || '';
            temperatureInput.value = result.globalAISettings.temperature || 0.7;
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const apiKey = apiKeyInput.value;
        const baseUrl = baseUrlInput.value;
        const globalAISettings = {
            model: modelInput.value,
            temperature: parseFloat(temperatureInput.value)
        };

        chrome.storage.sync.set({ apiKey, baseUrl, globalAISettings }, () => {
            console.log('Settings saved:', { apiKey: apiKey ? 'Set' : 'Not set', baseUrl, globalAISettings });
            chrome.runtime.sendMessage({action: 'updateAISettings', settings: { apiKey, baseUrl, ...globalAISettings }}, (response) => {
                if (response.success) {
                    alert('Settings saved successfully');
                } else {
                    alert('Failed to save settings');
                }
            });
        });
    });
});
