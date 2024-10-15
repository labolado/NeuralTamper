class AIService {
  constructor() {
    this.apiKey = null;
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
    this.timeout = 60000; // 设置超时时间为60秒
  }

  async initialize() {
    try {
      const result = await chrome.storage.sync.get(['apiKey', 'baseUrl']);
      this.apiKey = result.apiKey;
      this.baseUrl = result.baseUrl || this.baseUrl;
      console.log('AIService initialized. API Key:', this.apiKey ? 'Set' : 'Not set', 'Base URL:', this.baseUrl);
    } catch (error) {
      console.error('Error initializing AIService:', error);
    }
  }

  async generateScript(prompt, pageHTML, settings) {
    console.log('Generating script. API Key:', this.apiKey ? 'Set' : 'Not set');
    if (!this.apiKey) {
      console.error('API key not set. Attempting to retrieve from storage...');
      await this.initialize();
      if (!this.apiKey) {
        throw new Error('API key not set');
      }
    }

    console.log('Generating script with AI');
    const structureHTML = this.getHTMLStructure(pageHTML);
    console.log('HTML structure extracted (length):', structureHTML.length);
    const messages = [
      { 
        role: 'system', 
        content: `You are an AI that generates JavaScript code for web page customization. Your task is to create a single JavaScript function that, when executed, will modify the current web page according to the user's request. The function should be self-contained and not rely on external libraries. It should be immediately executable when injected into the web page.

Instructions:
1. Analyze the HTML document provided in the user's message.
2. Generate a JavaScript function that implements all requested modifications base the HTML document.
3. Ensure the function is compatible with modern browsers.
4. Do not include any explanations, comments, or markdown formatting in your response.
5. Return only the raw JavaScript code for the function.
6. If the task involves AI-generated content (like summaries), include placeholder text or logic to represent where that content would be generated, but do not actually generate the content.`
      },
      { 
        role: 'user', 
        content: `User request: ${prompt}

HTML structure:
${structureHTML}`
      }
    ];

    try {
      console.log('Sending request to AI API...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: settings.model,
          messages: messages,
          temperature: settings.temperature,
          max_tokens: 1000 // 限制生成的令牌数
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI API request failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`AI API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('AI generated script successfully');
      const generatedCode = data.choices[0].message.content.trim();
      
      // 移除可能的 Markdown 代码块格式
      const cleanCode = generatedCode.replace(/^```javascript\n?|\n?```$/g, '');
      
      console.log('Cleaned generated code:', cleanCode);
      return cleanCode;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timed out');
        throw new Error('Request timed out');
      }
      console.error('Error generating script:', error);
      throw error;
    }
  }

  getHTMLStructure(html) {
    // 使用正则表达式提取标签结构
    const tagPattern = /<(\w+)(?:\s+[^>]*)?(?:>(.*?)<\/\1>|\s*\/>)/gs;
    let structure = '';
    let depth = 0;

    html.replace(tagPattern, (match, tag, content) => {
      const indent = '  '.repeat(depth);
      structure += `${indent}<${tag}>\n`;
      if (content) {
        depth++;
        structure += this.getHTMLStructure(content);
        depth--;
      }
      return match;
    });

    return structure;
  }

  async updateSettings(apiKey, baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    console.log('Updating settings. New API Key:', apiKey ? 'Set' : 'Not set', 'New Base URL:', baseUrl);
    await chrome.storage.sync.set({ apiKey, baseUrl });
  }
}

export default AIService;
