// Enhanced AI Chatbot with Provider Switching
let chatHistory = [];
let isChatOpen = false;
let isTyping = false;
let currentAIProvider = 'gemini'; // Default AI provider
let availableProviders = [];

// Initialize chatbot with AI capabilities
function initializeChatbot() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeChatbotDom);
    } else {
        initializeChatbotDom();
    }
}

// Initialize chatbot DOM elements
function initializeChatbotDom() {
    try {
        const existingWidget = document.getElementById('chat-widget');
        if (existingWidget) {
            console.log('🤖 Using existing chat widget from HTML');
            setupChatEventListeners();
            showChatWidget();
        } else {
            console.log('🤖 Creating new AI chat widget');
            createChatWidget();
            setupChatEventListeners();
        }
        
        // Load AI providers info
        loadAIProviders();
        
        console.log('✅ AI Chatbot initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing AI chatbot:', error);
    }
}

// Load available AI providers
async function loadAIProviders() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/ai-chatbot/providers`);
        const result = await response.json();
        
        if (result.success) {
            availableProviders = result.data.providers;
            currentAIProvider = result.data.currentProvider;
            
            // Update chat header với AI provider
            updateChatHeader();
            
            console.log(`🤖 Current AI Provider: ${currentAIProvider.toUpperCase()}`);
            console.log('📋 Available providers:', availableProviders.map(p => p.name));
        }
    } catch (error) {
        console.error('❌ Error loading AI providers:', error);
    }
}

// Create enhanced chat widget with AI features
function createChatWidget() {
    const chatWidget = document.createElement('div');
    chatWidget.id = 'chat-widget';
    chatWidget.innerHTML = `
        <!-- Chat Toggle Button -->
        <div id="chat-toggle" class="chat-toggle">
            <div class="chat-icon">🤖</div>
            <div class="chat-badge" id="chat-badge" style="display: none;">AI</div>
        </div>
        
        <!-- Chat Window -->
        <div id="chat-window" class="chat-window" style="display: none;">
            <div class="chat-header">
                <div class="chat-title">
                    <div class="chat-avatar">🤖</div>
                    <div>
                        <div class="chat-name">AI Medical Assistant</div>
                        <div class="chat-status" id="ai-provider-status">Powered by AI</div>
                    </div>
                </div>
                <div class="chat-controls">
                    <button id="ai-settings-btn" class="chat-settings-btn" onclick="showAISettings()" title="AI Settings">
                        ⚙️
                    </button>
                    <button id="chat-close" class="chat-close" onclick="toggleChat()">&times;</button>
                </div>
            </div>
            
            <!-- AI Provider Selection Panel -->
            <div id="ai-settings-panel" class="ai-settings-panel" style="display: none;">
                <div class="ai-settings-header">
                    <h4>AI Provider Settings</h4>
                    <button onclick="hideAISettings()">×</button>
                </div>
                <div class="ai-providers-list" id="ai-providers-list">
                    <!-- Will be populated dynamically -->
                </div>
            </div>
            
            <!-- Chat Messages -->
            <div id="chat-messages" class="chat-messages">
                <div class="message bot-message">
                    <div class="message-avatar">🤖</div>
                    <div class="message-content">
                        <div class="message-text">
                            Xin chào! Tôi là AI Medical Assistant được tích hợp với nhiều AI engine mạnh mẽ. 
                            Tôi có thể trả lời các câu hỏi về thuốc dựa trên tài liệu từ Google Drive.
                            <br><br>
                            <strong>Tính năng mới:</strong>
                            <ul>
                                <li>🤖 Tích hợp Google Gemini AI (miễn phí)</li>
                                <li>⚡ Groq AI (siêu nhanh & miễn phí)</li>
                                <li>🧠 OpenAI GPT (chất lượng cao)</li>
                                <li>📚 Chỉ trả lời về thuốc có trong Drive</li>
                            </ul>
                        </div>
                        <div class="message-time">Vừa xong</div>
                    </div>
                </div>
            </div>
            
            <!-- Chat Suggestions -->
            <div class="chat-suggestions" id="chat-suggestions">
                <div class="suggestion-item" onclick="sendSuggestion('Thuốc paracetamol dùng như thế nào?')">
                    💊 Paracetamol dùng như thế nào?
                </div>
                <div class="suggestion-item" onclick="sendSuggestion('Liều lượng thuốc cho trẻ em')">
                    👶 Liều lượng cho trẻ em
                </div>
                <div class="suggestion-item" onclick="sendSuggestion('Tác dụng phụ của thuốc')">
                    ⚠️ Tác dụng phụ
                </div>
            </div>
            
            <!-- Chat Input -->
            <div class="chat-input-container">
                <div class="typing-indicator" id="typing-indicator" style="display: none;">
                    <span></span>
                    <span></span>
                    <span></span>
                    <div class="typing-text">AI đang suy nghĩ...</div>
                </div>
                <div class="chat-input-wrapper">
                    <input type="text" id="chat-input" placeholder="Hỏi AI về thuốc..." maxlength="1000">
                    <button id="chat-send" onclick="sendMessage()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(chatWidget);
}

// Setup event listeners
function setupChatEventListeners() {
    const chatToggle = document.getElementById('chat-toggle');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    
    if (chatToggle) {
        chatToggle.addEventListener('click', toggleChat);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        chatInput.addEventListener('input', function() {
            const sendBtn = document.getElementById('chat-send');
            if (sendBtn) {
                sendBtn.disabled = this.value.trim().length === 0;
            }
        });
    }
    
    if (chatSend) {
        chatSend.disabled = true;
    }
}

// Update chat header with current AI provider
function updateChatHeader() {
    const statusElement = document.getElementById('ai-provider-status');
    if (statusElement && currentAIProvider) {
        const provider = availableProviders.find(p => p.name === currentAIProvider);
        if (provider) {
            statusElement.textContent = `Powered by ${provider.displayName} AI`;
            statusElement.style.color = provider.status === 'ready' ? '#00b383' : '#ff6b6b';
        }
    }
}

// Show AI settings panel
function showAISettings() {
    const panel = document.getElementById('ai-settings-panel');
    const providersList = document.getElementById('ai-providers-list');
    
    if (panel && providersList) {
        // Populate providers list
        providersList.innerHTML = availableProviders.map(provider => `
            <div class="ai-provider-item ${provider.isActive ? 'active' : ''} ${provider.status}">
                <div class="provider-info">
                    <div class="provider-name">${provider.displayName}</div>
                    <div class="provider-description">${provider.description}</div>
                    <div class="provider-status status-${provider.status}">${provider.status === 'ready' ? '✅ Sẵn sàng' : provider.status === 'needs_api_key' ? '🔑 Cần API key' : '❌ Không khả dụng'}</div>
                </div>
                <button class="provider-action-btn" 
                        onclick="switchAIProvider('${provider.name}')"
                        ${provider.status !== 'ready' ? 'disabled' : ''}
                        ${provider.isActive ? 'style="display:none"' : ''}>
                    ${provider.isActive ? 'Đang dùng' : 'Chuyển sang'}
                </button>
            </div>
        `).join('');
        
        panel.style.display = 'block';
    }
}

// Hide AI settings panel
function hideAISettings() {
    const panel = document.getElementById('ai-settings-panel');
    if (panel) {
        panel.style.display = 'none';
    }
}

// Switch AI provider
async function switchAIProvider(providerName) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/ai-chatbot/switch-provider`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ provider: providerName })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentAIProvider = providerName;
            
            // Update UI
            await loadAIProviders();
            hideAISettings();
            
            // Add system message
            addMessage(`🔄 Đã chuyển sang ${providerName.toUpperCase()} AI thành công! Hãy thử hỏi một câu hỏi mới.`, 'bot', {
                isSystem: true
            });
            
        } else {
            addMessage(`❌ Không thể chuyển sang ${providerName}: ${result.message}`, 'bot', { isError: true });
        }
        
    } catch (error) {
        console.error('Error switching AI provider:', error);
        addMessage('❌ Lỗi khi chuyển đổi AI provider.', 'bot', { isError: true });
    }
}

// Send message to AI
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input?.value?.trim();
    
    if (!message || isTyping) return;
    
    // Add user message
    addMessage(message, 'user');
    input.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Send to AI chatbot API
        const response = await fetch(`${BACKEND_URL}/api/ai-chatbot/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                userId: getLoggedInUser() || 'anonymous'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Add AI response
            addMessage(result.data.message, 'bot', {
                sources: result.data.sources,
                confidence: result.data.confidence,
                responseTime: result.data.responseTime,
                aiProvider: result.data.aiProvider,
                aiModel: result.data.aiModel,
                isAiGenerated: result.data.isAiGenerated
            });
        } else {
            addMessage(result.message || 'Đã xảy ra lỗi với AI. Vui lòng thử lại.', 'bot', { isError: true });
        }
        
    } catch (error) {
        console.error('AI Chat error:', error);
        addMessage('Không thể kết nối đến AI server. Vui lòng kiểm tra kết nối mạng.', 'bot', { isError: true });
    } finally {
        hideTypingIndicator();
    }
}

// Send suggestion
function sendSuggestion(suggestionText) {
    const input = document.getElementById('chat-input');
    if (input) {
        input.value = suggestionText;
        sendMessage();
    }
}

// Add message with AI enhancements
function addMessage(text, sender, metadata = {}) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const isBot = sender === 'bot';
    const avatar = isBot ? '🤖' : '👤';
    
    let messageHTML = `
        <div class="message-content ${metadata.isError ? 'error-message' : ''} ${metadata.isSystem ? 'system-message' : ''}">
            <div class="message-text">${text}</div>
    `;
    
    // Add AI metadata
    if (isBot && metadata.isAiGenerated) {
        messageHTML += `
            <div class="ai-metadata">
                <div class="ai-model-info">
                    <span class="ai-badge">🤖 ${metadata.aiProvider || 'AI'}</span>
                    ${metadata.aiModel ? `<span class="ai-model">${metadata.aiModel}</span>` : ''}
                </div>
                ${metadata.responseTime ? `<div class="response-time">⚡ ${metadata.responseTime}ms</div>` : ''}
            </div>
        `;
    }
    
    // Add sources if available
    if (metadata.sources && Array.isArray(metadata.sources) && metadata.sources.length > 0) {
        messageHTML += `
            <div class="message-sources">
                <small><strong>Nguồn tham khảo:</strong></small>
                ${metadata.sources.map(source => `
                    <div class="source-item">
                        📄 ${source.title} (${source.confidence}% tin cậy)
                        <br><em>Từ: ${source.source}</em>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Add confidence badge
    if (metadata.confidence && metadata.confidence > 0) {
        messageHTML += `
            <div class="confidence-badge">
                Độ tin cậy: ${metadata.confidence}%
            </div>
        `;
    }
    
    messageHTML += `
            <div class="message-time">${new Date().toLocaleTimeString('vi-VN')}</div>
        </div>
    `;
    
    if (isBot) {
        messageHTML = `<div class="message-avatar">${avatar}</div>` + messageHTML;
    } else {
        messageHTML = messageHTML + `<div class="message-avatar">${avatar}</div>`;
    }
    
    messageDiv.innerHTML = messageHTML;
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Store in history
    chatHistory.push({ text, sender, timestamp: new Date(), metadata });
}

// Toggle chat window
function toggleChat() {
    const chatWindow = document.getElementById('chat-window');
    const chatToggle = document.getElementById('chat-toggle');
    const chatBadge = document.getElementById('chat-badge');
    
    if (!chatWindow || !chatToggle) return;
    
    isChatOpen = !isChatOpen;
    
    if (isChatOpen) {
        chatWindow.style.display = 'flex';
        chatToggle.classList.add('active');
        if (chatBadge) chatBadge.style.display = 'none';
        
        // Focus input
        const input = document.getElementById('chat-input');
        if (input) {
            setTimeout(() => input.focus(), 300);
        }
    } else {
        chatWindow.style.display = 'none';
        chatToggle.classList.remove('active');
        hideAISettings();
    }
}

// Show/hide typing indicator
function showTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.style.display = 'flex';
        isTyping = true;
    }
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.style.display = 'none';
        isTyping = false;
    }
}

// Show chat widget
function showChatWidget() {
    const widget = document.getElementById('chat-widget');
    if (widget) {
        widget.style.display = 'block';
    }
}

// Get logged in user
function getLoggedInUser() {
    // This function should be implemented based on your auth system
    try {
        return localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    } catch (error) {
        return 'anonymous';
    }
}

// Initialize when script loads
initializeChatbot();
