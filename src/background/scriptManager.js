import AIService from './aiService';

class ScriptManager {
  constructor() {
    console.log('ScriptManager constructor called');
    this.scripts = [];
    this.aiService = new AIService();
    this.loadScripts();
  }

  async loadScripts() {
    console.log('Loading scripts...');
    const result = await chrome.storage.local.get('scripts');
    this.scripts = result.scripts || [];
    console.log('Loaded scripts:', this.scripts);
    if (this.scripts.length === 0) {
      console.log('No scripts found in storage');
    }
    return this.scripts;
  }

  async saveScripts() {
    await chrome.storage.local.set({ scripts: this.scripts });
  }

  async addScript(script) {
    this.scripts.push(script);
    await this.saveScripts();
  }

  async updateScript(index, script) {
    this.scripts[index] = script;
    await this.saveScripts();
  }

  async deleteScript(index) {
    this.scripts.splice(index, 1);
    await this.saveScripts();
  }

  async toggleScript(index, enabled) {
    if (index >= 0 && index < this.scripts.length) {
      this.scripts[index].enabled = enabled;
      await this.saveScripts();
    } else {
      throw new Error('Invalid script index');
    }
  }

  async executeMatchingScripts(tabId, url, pageHTML, globalAISettings, additionalScripts = []) {
    console.log(`Executing matching scripts for URL: ${url}`);
    console.log('Current scripts:', this.scripts);
    
    if (url.startsWith('chrome://')) {
      console.log('Skipping chrome:// URL');
      return;
    }

    const allScripts = [...this.scripts, ...additionalScripts];
    const matchingScripts = allScripts.filter(script => {
      if (!script.enabled) {
        console.log(`Script "${script.name}" is disabled, skipping`);
        return false;
      }
      try {
        const pattern = script.matchPattern
          .replace(/\*/g, '.*')
          .replace(/^\*:\/\//, 'https?://');
        const regex = new RegExp(pattern);
        const matches = regex.test(url);
        console.log(`Script "${script.name}" (pattern: ${script.matchPattern}) ${matches ? 'matches' : 'does not match'} URL ${url}`);
        console.log(`Regex used: ${regex}`);
        return matches;
      } catch (error) {
        console.error('Invalid match pattern:', script.matchPattern, error);
        return false;
      }
    });

    console.log(`Found ${matchingScripts.length} matching scripts`);

    for (const script of matchingScripts) {
      try {
        console.log(`Generating code for script: ${script.name}`);
        console.log('Script prompt:', script.code);
        const generatedCode = await this.aiService.generateScript(script.code, pageHTML, globalAISettings);
        console.log(`Generated code for script ${script.name}:`, generatedCode);
        console.log(`Executing generated code for script: ${script.name}`);
        
        await this.executeGeneratedScript(tabId, generatedCode);
        
        console.log(`Script ${script.name} executed successfully`);
      } catch (error) {
        console.error(`Error generating or executing script ${script.name}:`, error);
      }
    }
  }

  async executeGeneratedScript(tabId, generatedCode) {
    try {
      console.log('Sending script to content script for execution:', generatedCode);
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'executeScript',
        code: generatedCode
      });
      console.log('Response from content script:', response);
      if (response && response.success) {
        console.log('Generated script injection completed successfully');
      } else {
        console.error('Generated script injection failed:', response ? response.error : 'Unknown error');
      }
    } catch (error) {
      console.error('Error injecting generated script:', error);
      throw error;
    }
  }
}

export default ScriptManager;
