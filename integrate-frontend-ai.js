// Frontend AI integration helper
// This script helps update existing frontend files with AI features

const fs = require('fs');
const path = require('path');

class FrontendAIIntegrator {
    constructor() {
        this.frontendPath = path.join(__dirname, '..', 'frontend', 'public');
        this.jsPath = path.join(this.frontendPath, 'js');
        this.cssPath = path.join(this.frontendPath, 'css');
        this.indexPath = path.join(this.frontendPath, 'index.html');
    }

    async integrate() {
        console.log('🎨 Integrating AI features into frontend...');
        
        try {
            // Check frontend structure
            this.checkFrontendStructure();
            
            // Update HTML
            this.updateIndexHtml();
            
            // Update CSS
            this.updateStyles();
            
            // Update JavaScript
            this.updateJavaScript();
            
            // Create AI chatbot file
            this.createAIChatbotFile();
            
            console.log('✅ Frontend AI integration complete!');
            this.showIntegrationSummary();
            
        } catch (error) {
            console.error('❌ Frontend integration error:', error.message);
        }
    }
    
    checkFrontendStructure() {
        console.log('📁 Checking frontend structure...');
        
        const requiredPaths = [
            this.frontendPath,
            this.jsPath,
            this.cssPath,
            this.indexPath
        ];
        
        requiredPaths.forEach(checkPath => {
            if (!fs.existsSync(checkPath)) {
                throw new Error(`Required path not found: ${checkPath}`);
            }
        });
        
        console.log('✅ Frontend structure OK');
    }
    
    updateIndexHtml() {
        console.log('📝 Updating index.html...');
        
        if (!fs.existsSync(this.indexPath)) {
            console.log('⚠️  index.html not found, skipping HTML update');
            return;
        }
        
        let html = fs.readFileSync(this.indexPath, 'utf8');
        
        // Create backup
        fs.writeFileSync(this.indexPath + '.backup', html);
        
        // Check if AI script already included
        if (html.includes('aiChatbot.js')) {
            console.log('⚠️  aiChatbot.js already included in HTML');
            return;
        }
        
        // Add AI script before closing head tag
        const aiScriptTag = '    <script src="js/aiChatbot.js"></script>';
        
        if (html.includes('</head>')) {
            html = html.replace('</head>', `${aiScriptTag}\n</head>`);
        } else {
            console.log('⚠️  Could not find </head> tag, please manually add AI script');
        }
        
        // Update chatbot header if exists
        const chatbotHeaderRegex = /<div[^>]*id=["']chatbot-header["'][^>]*>([\s\S]*?)<\/div>/i;
        const headerMatch = html.match(chatbotHeaderRegex);
        
        if (headerMatch) {
            const newHeader = `<div id="chatbot-header">
    <span>Trợ lý Y tế AI</span>
    <button id="ai-settings-btn" title="Cài đặt AI">⚙️</button>
</div>`;
            html = html.replace(headerMatch[0], newHeader);
        }
        
        // Add AI settings panel after chatbot header
        const aiSettingsPanel = `
<!-- AI Settings Panel -->
<div id="ai-settings-panel" class="hidden">
    <h4>Chọn AI Provider</h4>
    <div id="ai-providers-list">
        <!-- Dynamically populated -->
    </div>
</div>`;
        
        if (html.includes('chatbot-header') && !html.includes('ai-settings-panel')) {
            const headerEndIndex = html.indexOf('</div>', html.indexOf('chatbot-header')) + 6;
            html = html.slice(0, headerEndIndex) + aiSettingsPanel + html.slice(headerEndIndex);
        }
        
        // Write updated HTML
        fs.writeFileSync(this.indexPath, html);
        console.log('✅ index.html updated');
    }
    
    updateStyles() {
        console.log('🎨 Updating styles.css...');
        
        const stylesPath = path.join(this.cssPath, 'styles.css');
        
        if (!fs.existsSync(stylesPath)) {
            console.log('⚠️  styles.css not found, creating new one');
            fs.writeFileSync(stylesPath, '/* AI Styles will be added below */\n');
        }
        
        let css = fs.readFileSync(stylesPath, 'utf8');
        
        // Create backup
        fs.writeFileSync(stylesPath + '.backup', css);
        
        // Check if AI styles already exist
        if (css.includes('ai-settings-panel') || css.includes('AI Settings Panel')) {
            console.log('⚠️  AI styles already exist in CSS');
            return;
        }
        
        // Add AI styles
        const aiStyles = `

/* ================================================
   AI CHATBOT STYLES - Auto-generated
   ================================================ */

/* AI Settings Panel */
#ai-settings-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

#ai-settings-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

#ai-settings-btn.ai-enabled {
  color: #4CAF50;
  animation: pulse 2s infinite;
}

#ai-settings-btn.ai-disabled {
  color: #666;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

#ai-settings-panel {
  position: absolute;
  top: 50px;
  right: 10px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 15px;
  width: 300px;
  z-index: 1000;
  transition: all 0.3s ease;
}

#ai-settings-panel.hidden {
  display: none;
}

#ai-settings-panel h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.ai-provider-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin: 5px 0;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.ai-provider-option.available {
  cursor: pointer;
  border-color: #e0e0e0;
}

.ai-provider-option.available:hover {
  border-color: #2196F3;
  background: #f5f5f5;
}

.ai-provider-option.selected {
  border-color: #4CAF50;
  background: #e8f5e8;
}

.ai-provider-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.provider-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.provider-icon {
  font-size: 20px;
}

.provider-details {
  display: flex;
  flex-direction: column;
}

.provider-name {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}

.provider-status {
  font-size: 12px;
  color: #666;
}

.switch-btn {
  background: #2196F3;
  color: white;
  border: none;
  padding: 5px 15px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.3s ease;
}

.switch-btn:hover {
  background: #1976D2;
}

/* AI Enhanced Messages */
.message.ai-enhanced {
  position: relative;
  border-left: 3px solid #4CAF50;
}

.ai-badge {
  font-size: 10px;
  color: #4CAF50;
  font-weight: bold;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Notifications */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  border-radius: 5px;
  color: white;
  font-weight: bold;
  z-index: 10000;
  animation: slideIn 0.3s ease;
}

.notification.success {
  background: #4CAF50;
}

.notification.error {
  background: #f44336;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Loading States */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-style: italic;
}

.typing-dot {
  width: 4px;
  height: 4px;
  background: #666;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

/* ================================================
   END AI CHATBOT STYLES
   ================================================ */
`;
        
        // Append AI styles to existing CSS
        css += aiStyles;
        
        // Write updated CSS
        fs.writeFileSync(stylesPath, css);
        console.log('✅ styles.css updated with AI styles');
    }
    
    updateJavaScript() {
        console.log('🔧 Updating JavaScript files...');
        
        // Update drugSearch.js or main chat file
        const drugSearchPath = path.join(this.jsPath, 'drugSearch.js');
        const utilsPath = path.join(this.jsPath, 'utils.js');
        
        // Create API config in utils.js or create new file
        this.createAPIConfig();
        
        // Update drugSearch.js if exists
        if (fs.existsSync(drugSearchPath)) {
            this.updateDrugSearchFile(drugSearchPath);
        } else {
            console.log('⚠️  drugSearch.js not found, please manually integrate AI into your chat logic');
        }
    }
    
    createAPIConfig() {
        const configPath = path.join(this.jsPath, 'apiConfig.js');
        
        const configContent = `// API Configuration for AI Integration
const API_CONFIG = {
  // Update with your Render backend URL
  BASE_URL: 'https://your-render-backend.onrender.com',
  
  // AI Endpoints
  AI_ENDPOINTS: {
    chat: '/api/ai/chat',
    providers: '/api/ai/providers', 
    switch: '/api/ai/switch-provider',
    status: '/api/ai/status'
  },
  
  // Request timeout
  TIMEOUT: 30000,
  
  // Default provider
  DEFAULT_PROVIDER: 'gemini'
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API_CONFIG;
} else {
  window.API_CONFIG = API_CONFIG;
}`;
        
        fs.writeFileSync(configPath, configContent);
        console.log('✅ Created apiConfig.js');
    }
    
    updateDrugSearchFile(filePath) {
        console.log('📝 Updating drugSearch.js...');
        
        let js = fs.readFileSync(filePath, 'utf8');
        
        // Create backup
        fs.writeFileSync(filePath + '.backup', js);
        
        // Check if AI integration already exists
        if (js.includes('aiChatbot') || js.includes('API_CONFIG')) {
            console.log('⚠️  AI integration already exists in drugSearch.js');
            return;
        }
        
        // Add AI integration comment
        const aiIntegrationComment = `
// ================================================
// AI INTEGRATION - Auto-generated
// ================================================

// Enhanced sendMessage function with AI support
async function sendMessageWithAI(message) {
  try {
    showTypingIndicator();
    
    const aiEnabled = localStorage.getItem('aiEnabled') === 'true';
    const currentProvider = localStorage.getItem('currentAIProvider') || 'original';
    
    if (aiEnabled && currentProvider !== 'original') {
      // Try AI first
      const response = await fetch(\`\${API_CONFIG.BASE_URL}\${API_CONFIG.AI_ENDPOINTS.chat}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, provider: currentProvider }),
        timeout: API_CONFIG.TIMEOUT
      });
      
      const data = await response.json();
      
      if (data.success) {
        displayAIResponse(data.response, data.provider);
        return;
      }
    }
    
    // Fallback to original chatbot
    await originalSendMessage(message);
    
  } catch (error) {
    console.error('AI Chat error:', error);
    await originalSendMessage(message);
  } finally {
    hideTypingIndicator();
  }
}

// Backup original sendMessage function
const originalSendMessage = sendMessage || function(message) {
  console.log('Original sendMessage not found, please implement manually');
};

// Replace sendMessage with AI-enhanced version
if (typeof sendMessage === 'function') {
  sendMessage = sendMessageWithAI;
}

function displayAIResponse(response, provider) {
  const messageElement = document.createElement('div');
  messageElement.className = 'message bot-message ai-enhanced';
  messageElement.innerHTML = \`
    <div class="ai-badge">\${getProviderIcon(provider)} \${getProviderName(provider)}</div>
    <div class="message-content">\${response}</div>
  \`;
  
  const messagesContainer = document.getElementById('chatbot-messages') || 
                          document.querySelector('.messages') ||
                          document.querySelector('#messages');
                          
  if (messagesContainer) {
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

function getProviderIcon(provider) {
  const icons = { 'gemini': '🧠', 'groq': '⚡', 'openai': '🤖', 'original': '💊' };
  return icons[provider] || '🤖';
}

function getProviderName(provider) {
  const names = { 'gemini': 'Gemini AI', 'groq': 'Groq AI', 'openai': 'OpenAI', 'original': 'Chatbot Gốc' };
  return names[provider] || 'AI';
}

function showTypingIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'typing-indicator';
  indicator.className = 'typing-indicator';
  indicator.innerHTML = 'AI đang suy nghĩ <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
  
  const messagesContainer = document.getElementById('chatbot-messages') || 
                          document.querySelector('.messages');
  if (messagesContainer) {
    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

function hideTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) {
    indicator.remove();
  }
}

// ================================================
// END AI INTEGRATION
// ================================================
`;
        
        // Append AI integration to existing JS
        js += aiIntegrationComment;
        
        // Write updated JS
        fs.writeFileSync(filePath, js);
        console.log('✅ drugSearch.js updated with AI integration');
    }
    
    createAIChatbotFile() {
        const aiChatbotPath = path.join(this.jsPath, 'aiChatbot.js');
        
        // Copy the AI chatbot file we created earlier
        const aiChatbotContent = fs.readFileSync(
            path.join(__dirname, '..', 'frontend', 'public', 'js', 'aiChatbot.js'), 
            'utf8'
        );
        
        fs.writeFileSync(aiChatbotPath, aiChatbotContent);
        console.log('✅ Created aiChatbot.js');
    }
    
    showIntegrationSummary() {
        console.log('\n🎉 Frontend AI Integration Summary:');
        console.log('===================================');
        console.log('✅ index.html - Added AI script and settings panel');
        console.log('✅ styles.css - Added AI styling');
        console.log('✅ apiConfig.js - Created API configuration');
        console.log('✅ aiChatbot.js - Created AI chatbot controller');
        console.log('✅ drugSearch.js - Enhanced with AI integration');
        
        console.log('\n📝 Manual Steps Needed:');
        console.log('1. Update API_CONFIG.BASE_URL in apiConfig.js with your Render backend URL');
        console.log('2. Test AI integration on local development server');
        console.log('3. Deploy to Firebase: firebase deploy');
        console.log('4. Verify CORS configuration on backend');
        
        console.log('\n📁 Backup Files Created:');
        console.log('• index.html.backup');
        console.log('• styles.css.backup');
        console.log('• drugSearch.js.backup');
        
        console.log('\n🔧 Next: Run integrate-ai-existing.bat to complete backend integration');
    }
}

// Run if called directly
if (require.main === module) {
    const integrator = new FrontendAIIntegrator();
    integrator.integrate();
}

module.exports = FrontendAIIntegrator;
