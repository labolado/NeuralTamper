document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    const scriptList = document.getElementById('scriptList');
    const newScriptButton = document.getElementById('newScript');
    const openOptionsButton = document.getElementById('openOptions');
    const generateScriptForm = document.getElementById('generateScriptForm');

    function loadScripts() {
        chrome.storage.local.get('scripts', (result) => {
            const scripts = result.scripts || [];
            scriptList.innerHTML = '';
            scripts.forEach((script, index) => {
                const scriptElement = document.createElement('div');
                scriptElement.className = 'flex items-center justify-between bg-gray-50 p-2 rounded';
                scriptElement.innerHTML = `
                    <span class="font-medium">${script.name}</span>
                    <div>
                        <button class="edit bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-sm mr-1">Edit</button>
                        <button class="delete bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded text-sm mr-1">Delete</button>
                        <input type="checkbox" class="form-checkbox h-5 w-5 text-blue-600" ${script.enabled ? 'checked' : ''}>
                    </div>
                `;
                scriptList.appendChild(scriptElement);

                scriptElement.querySelector('.edit').addEventListener('click', () => editScript(index));
                scriptElement.querySelector('.delete').addEventListener('click', () => deleteScript(index));
                scriptElement.querySelector('input[type="checkbox"]').addEventListener('change', (e) => toggleScript(index, e.target.checked));
            });
        });
    }

    function editScript(index) {
        chrome.storage.local.get('scripts', (result) => {
            const scripts = result.scripts || [];
            const script = scripts[index];
            openScriptEditor(script, index);
        });
    }

    function deleteScript(index) {
        chrome.runtime.sendMessage({action: 'deleteScript', index}, (response) => {
            if (response.success) {
                loadScripts();
            } else {
                console.error('Failed to delete script');
            }
        });
    }

    function toggleScript(index, enabled) {
        chrome.runtime.sendMessage({action: 'toggleScript', index, enabled}, (response) => {
            if (!response.success) {
                console.error('Failed to toggle script');
            }
        });
    }

    newScriptButton.addEventListener('click', () => {
        openScriptEditor();
    });

    openOptionsButton.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    generateScriptForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prompt = document.getElementById('scriptPrompt').value;
        if (!prompt) {
            alert('Please enter a script prompt');
            return;
        }

        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            const response = await chrome.runtime.sendMessage({
                action: 'executePromptScript',
                prompt: prompt,
                tabId: tab.id
            });

            if (response.success) {
                alert('Script generated and applied successfully!');
            } else {
                alert('Failed to generate or apply script: ' + response.error);
            }
        } catch (error) {
            console.error('Error generating and applying script:', error);
            alert('An error occurred while generating and applying the script.');
        }
    });

    function openScriptEditor(script = null, index = null) {
        const editorContainer = document.createElement('div');
        editorContainer.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full';
        editorContainer.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <button id="backButton" class="absolute top-2 left-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1 px-2 rounded">
                    &larr; Back
                </button>
                <h2 class="text-lg font-bold mb-4 mt-6">${script ? 'Edit Script' : 'New Script'}</h2>
                <div class="mb-4">
                    <label for="scriptName" class="block text-sm font-medium text-gray-700">Name:</label>
                    <input type="text" id="scriptName" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" value="${script ? script.name : ''}">
                </div>
                <div class="mb-4">
                    <label for="scriptPattern" class="block text-sm font-medium text-gray-700">URL Pattern:</label>
                    <input type="text" id="scriptPattern" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" value="${script ? script.matchPattern : '*://*/*'}">
                </div>
                <div class="mb-4">
                    <label for="scriptCode" class="block text-sm font-medium text-gray-700">Prompt:</label>
                    <textarea id="scriptCode" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" rows="10">${script ? script.code : ''}</textarea>
                </div>
                <div class="flex justify-end space-x-2">
                    <button id="saveScript" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">Save</button>
                    <button id="cancelEdit" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">Cancel</button>
                </div>
            </div>
        `;

        app.appendChild(editorContainer);

        document.getElementById('backButton').addEventListener('click', () => {
            editorContainer.remove();
        });

        document.getElementById('saveScript').addEventListener('click', () => {
            const newScript = {
                name: document.getElementById('scriptName').value,
                matchPattern: document.getElementById('scriptPattern').value,
                code: document.getElementById('scriptCode').value,
                enabled: script ? script.enabled : true
            };

            if (index !== null) {
                chrome.runtime.sendMessage({action: 'updateScript', index, script: newScript}, (response) => {
                    if (response.success) {
                        console.log('Script updated successfully:', newScript);
                        editorContainer.remove();
                        loadScripts();
                    } else {
                        console.error('Failed to update script');
                    }
                });
            } else {
                chrome.runtime.sendMessage({action: 'addScript', script: newScript}, (response) => {
                    if (response.success) {
                        console.log('Script added successfully:', newScript);
                        chrome.storage.local.get('scripts', (result) => {
                            console.log('All scripts after adding:', result.scripts);
                        });
                        editorContainer.remove();
                        loadScripts();
                    } else {
                        console.error('Failed to add script');
                    }
                });
            }
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            editorContainer.remove();
        });
    }

    loadScripts();
});
