// Enhanced AI Chatbot with Provider Switching

// Ensure BACKEND_URL is available
if (typeof BACKEND_URL === 'undefined') {
    const BACKEND_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://pedmedvn.onrender.com';
    console.log('⚠️ BACKEND_URL not found, using fallback:', BACKEND_URL);
}

let chatHistory = [];
let isChatOpen = false;
let isTyping = false;
let currentAIProvider = 'groq'; // Default AI provider
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
        // Check if user is logged in first
        if (document.body.classList.contains('login-active')) {
            console.log('🤖 Login screen active, not showing chatbot');
            return;
        }
        
        const existingWidget = document.getElementById('chat-widget');
        if (existingWidget) {
            console.log('🤖 Using existing chat widget from HTML');
            setupChatEventListeners();
        } else {
            console.log('🤖 Creating new AI chat widget');
            createChatWidget();
            setupChatEventListeners();
        }
        
        // Show chat toggle button (not the full widget)
        showChatToggle();
        
        // Load AI providers info
        loadAIProviders();
        
        console.log('✅ AI Chatbot initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing AI chatbot:', error);
    }
}

// Load available AI providers
async function loadAIProviders() {
    console.log('🔄 Loading AI providers...');
    
    try {
        const apiUrl = `${BACKEND_URL}/api/ai-chatbot/providers`;
        console.log('📡 Fetching from:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response ok:', response.ok);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📦 Response data:', result);
        
        if (result.success) {
            availableProviders = result.data.providers;
            currentAIProvider = result.data.currentProvider;
            
            console.log('✅ Providers loaded successfully:');
            console.log('📋 Available providers:', availableProviders);
            console.log(`🤖 Current AI Provider: ${currentAIProvider}`);
            
            // Update chat header với AI provider
            updateChatHeader();
        } else {
            console.error('❌ API returned success: false', result);
            throw new Error(result.message || 'Unknown API error');
        }
    } catch (error) {
        console.error('❌ Error loading AI providers:', error);
        console.error('🔍 Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        // Set fallback providers for offline mode
        console.log('� Setting fallback providers...');
        availableProviders = [
            {
                name: 'gemini',
                displayName: 'Google Gemini AI',
                description: 'AI miễn phí từ Google với 50 requests/day',
                status: 'ready',
                isActive: true
            },
            {
                name: 'groq',
                displayName: 'Groq AI',
                description: 'AI siêu nhanh với 14,400 requests/day MIỄN PHÍ',
                status: 'needs_api_key',
                isActive: false
            }
        ];
        currentAIProvider = 'gemini';
        console.log('⚠️ Using fallback providers');
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
            <div class="chat-tooltip">Trợ lý ảo PedMedVN</div>
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
                                <li>⚡ Groq AI (siêu nhanh & miễn phí)</li>
                                <li>� Tích hợp Google Gemini AI (miễn phí)</li>
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

// Show chat toggle button (round button with tooltip)
function showChatToggle() {
    // Remove any existing chat button
    const existingButton = document.getElementById('chat-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    // Just show the widget element (but keep chat window closed)
    const chatWidget = document.getElementById('chat-widget');
    if (chatWidget) {
        chatWidget.style.display = 'block';
        // Ensure chat window is closed initially
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow) {
            chatWindow.style.display = 'none';
        }
    }
    console.log('✅ Chat toggle button shown');
}

// Toggle between chat button and chat widget
function toggleChatWidget() {
    const existingButton = document.getElementById('chat-button');
    const existingWidget = document.getElementById('chat-widget');
    
    if (existingButton) {
        existingButton.remove();
        if (!existingWidget) {
            createChatWidget();
            showChatWidget();
        }
    }
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
            let statusText = `Powered by ${provider.displayName} AI`;
            
            // Thêm thông tin quota cho các providers
            if (currentAIProvider === 'groq') {
                statusText += ' • 14,400 requests/day FREE';
            } else if (currentAIProvider === 'gemini') {
                statusText += ' • 50 requests/day';
            }
            
            statusElement.textContent = statusText;
            statusElement.style.color = provider.status === 'ready' ? '#00b383' : '#ff6b6b';
            
            // Thêm emoji cho provider hiện tại
            const providerEmoji = {
                'groq': '⚡', // Lightning for speed
                'gemini': '🧠', // Brain for intelligence  
                'original': '📚' // Books for local docs
            };
            
            const chatAvatar = document.querySelector('.chat-avatar');
            if (chatAvatar) {
                chatAvatar.textContent = providerEmoji[currentAIProvider] || '🤖';
            }
        }
    }
}

// Show AI settings panel
function showAISettings() {
    console.log('🔧 Opening AI Settings...');
    console.log('📋 Available providers:', availableProviders);
    
    const panel = document.getElementById('ai-settings-panel');
    const providersList = document.getElementById('ai-providers-list');
    
    if (!panel || !providersList) {
        console.error('❌ AI settings panel elements not found');
        return;
    }
    
    // If providers not loaded yet, try to load them
    if (!availableProviders || availableProviders.length === 0) {
        console.log('⚠️ No providers loaded, attempting to load...');
        loadAIProviders().then(() => {
            if (availableProviders && availableProviders.length > 0) {
                showAISettings(); // Retry after loading
            } else {
                // Show fallback if still no providers
                showFallbackProviders();
            }
        }).catch(error => {
            console.error('❌ Failed to load providers:', error);
            showFallbackProviders();
        });
        return;
    }
    
    // Populate providers list
    providersList.innerHTML = availableProviders.map(provider => {
        // Thêm thông tin chi tiết cho từng provider
        let providerQuota = '';
        let providerBadge = '';
        
        if (provider.name === 'groq') {
            providerQuota = '⚡ 14,400 requests/day FREE';
            providerBadge = '<span class="provider-badge free">UNLIMITED FREE</span>';
        } else if (provider.name === 'gemini') {
            providerQuota = '🧠 50 requests/day FREE';
            providerBadge = '<span class="provider-badge limited">LIMITED FREE</span>';
        } else if (provider.name === 'original') {
            providerQuota = '📚 Local documents only';
            providerBadge = '<span class="provider-badge basic">BASIC</span>';
        }
        
        return `
        <div class="ai-provider-item ${provider.isActive ? 'active' : ''} ${provider.status}">
            <div class="provider-info">
                <div class="provider-header">
                    <div class="provider-name">${provider.displayName}</div>
                    ${providerBadge}
                </div>
                <div class="provider-description">${provider.description}</div>
                <div class="provider-quota">${providerQuota}</div>
                <div class="provider-status status-${provider.status}">${provider.status === 'ready' ? '✅ Sẵn sàng' : provider.status === 'needs_api_key' ? '🔑 Cần API key' : '❌ Không khả dụng'}</div>
            </div>
            <button class="provider-action-btn" 
                    onclick="switchAIProvider('${provider.name}')"
                    ${provider.status !== 'ready' ? 'disabled' : ''}
                    ${provider.isActive ? 'style="background: #00b383; color: white;"' : ''}>
                ${provider.isActive ? 'Đang dùng' : 'Chuyển sang'}
            </button>
        </div>`;
    }).join('');
    
    panel.style.display = 'block';
    console.log('✅ AI Settings panel displayed');
}

// Show fallback providers when backend is not available
function showFallbackProviders() {
    console.log('🔄 Showing fallback providers...');
    
    const panel = document.getElementById('ai-settings-panel');
    const providersList = document.getElementById('ai-providers-list');
    
    if (!panel || !providersList) return;
    
    // Create fallback provider list
    const fallbackProviders = [
        {
            name: 'gemini',
            displayName: 'Google Gemini AI',
            description: 'AI miễn phí từ Google với 50 requests/day',
            status: 'ready',
            isActive: true
        },
        {
            name: 'groq',
            displayName: 'Groq AI',
            description: 'AI siêu nhanh với 14,400 requests/day MIỄN PHÍ',
            status: 'needs_api_key',
            isActive: false
        },
        {
            name: 'gemini',
            displayName: 'Google Gemini',
            description: 'AI thông minh từ Google với 50 requests/day FREE',
            status: 'needs_api_key',
            isActive: false
        }
    ];
    
    providersList.innerHTML = fallbackProviders.map(provider => {
        let providerQuota = '';
        let providerBadge = '';
        
        if (provider.name === 'groq') {
            providerQuota = '⚡ 14,400 requests/day FREE';
            providerBadge = '<span class="provider-badge free">UNLIMITED FREE</span>';
        } else if (provider.name === 'gemini') {
            providerQuota = '🧠 50 requests/day FREE';
            providerBadge = '<span class="provider-badge limited">LIMITED FREE</span>';
        }
        
        return `
        <div class="ai-provider-item ${provider.isActive ? 'active' : ''} ${provider.status}">
            <div class="provider-info">
                <div class="provider-header">
                    <div class="provider-name">${provider.displayName}</div>
                    ${providerBadge}
                </div>
                <div class="provider-description">${provider.description}</div>
                <div class="provider-quota">${providerQuota}</div>
                <div class="provider-status status-${provider.status}">${provider.status === 'ready' ? '✅ Sẵn sàng' : provider.status === 'needs_api_key' ? '🔑 Cần API key' : '❌ Không khả dụng'}</div>
            </div>
            <button class="provider-action-btn" 
                    onclick="switchAIProvider('${provider.name}')"
                    ${provider.status !== 'ready' ? 'disabled' : ''}
                    ${provider.isActive ? 'style="background: #00b383; color: white;"' : ''}>
                ${provider.isActive ? 'Đang dùng' : 'Chuyển sang'}
            </button>
        </div>`;
    }).join('');
    
    // Add notice about backend connection
    providersList.innerHTML += `
        <div class="provider-notice">
            <p>⚠️ <strong>Không thể kết nối với backend.</strong></p>
            <p>Đây là danh sách AI providers fallback. Để sử dụng đầy đủ tính năng, vui lòng:</p>
            <ul>
                <li>Khởi động backend server: <code>npm run dev</code></li>
                <li>Kiểm tra kết nối mạng</li>
                <li>Reload trang sau khi backend ready</li>
            </ul>
        </div>
    `;
    
    panel.style.display = 'block';
    console.log('✅ Fallback AI Settings panel displayed');
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
        console.log('🔄 Switching to provider:', providerName);
        console.log('📡 Backend URL:', BACKEND_URL);
        
        const apiUrl = `${BACKEND_URL}/api/ai-chatbot/switch-provider`;
        console.log('📡 Full API URL:', apiUrl);
        
        const requestBody = { provider: providerName };
        console.log('📦 Request body:', requestBody);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response error text:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('📦 Response data:', result);
        
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
                aiModel: result.data.model || result.data.aiModel,
                isAiGenerated: result.data.isAiGenerated,
                note: result.data.note // Show quota note if exists
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
    
    // Add quota note if exists
    if (metadata.note) {
        messageHTML += `
            <div class="quota-note" style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 8px 12px; border-radius: 6px; margin-top: 8px; font-size: 12px; color: #856404;">
                ℹ️ ${metadata.note}
            </div>
        `;
    }
    
    // Sources removed per user request - cleaner UI
    // if (metadata.sources && Array.isArray(metadata.sources) && metadata.sources.length > 0) {
    //     messageHTML += `
    //         <div class="message-sources">
    //             <small><strong>Nguồn tham khảo:</strong></small>
    //             ${metadata.sources.map(source => `
    //                 <div class="source-item">
    //                     📄 ${source.title} (${source.confidence}% tin cậy)
    //                     <br><em>Từ: ${source.source}</em>
    //                 </div>
    //             `).join('')}
    //         </div>
    //     `;
    // }
    
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
