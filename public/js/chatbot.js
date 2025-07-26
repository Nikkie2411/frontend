// Chatbot functionality for frontend
let chatHistory = [];
let isChatOpen = false;
let isTyping = false;

// Initialize chatbot with DOM ready check
function initializeChatbot() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeChatbotDom);
    } else {
        initializeChatbotDom();
    }
}

// Initialize chatbot DOM elements
function initializeChatbotDom() {
    try {
        // Only initialize chatbot if user is logged in
        if (!Auth.isLoggedIn()) {
            console.log('🤖 User not logged in, skipping chatbot initialization');
            return;
        }
        
        // Check if widget already exists in HTML
        const existingWidget = document.getElementById('chat-widget');
        if (existingWidget) {
            console.log('🤖 Using existing chat widget from HTML');
            setupChatEventListeners();
            showChatWidget();
        } else {
            console.log('🤖 Creating new chat widget');
            createChatWidget();
            setupChatEventListeners();
        }
        console.log('✅ Chatbot initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing chatbot:', error);
    }
}

// Create chat widget HTML
function createChatWidget() {
    const chatWidget = document.createElement('div');
    chatWidget.id = 'chat-widget';
    chatWidget.innerHTML = `
        <!-- Chat Toggle Button -->
        <div id="chat-toggle" class="chat-toggle" title="Trợ lý ảo PedMedVN">
            <div class="chat-icon">💬</div>
            <div class="chat-badge" id="chat-badge" style="display: none;">1</div>
            <div class="chat-tooltip">Trợ lý ảo PedMedVN</div>
        </div>
        
        <!-- Chat Window -->
        <div id="chat-window" class="chat-window" style="display: none;">
            <div class="chat-header">
                <div class="chat-title">
                    <div class="chat-avatar">🤖</div>
                    <div>
                        <div class="chat-name">PedMed Assistant</div>
                        <div class="chat-status">Hỗ trợ thông tin thuốc nhi khoa</div>
                    </div>
                </div>
            </div>
            
            <div class="chat-messages" id="chat-messages">
                <div class="message bot-message">
                    <div class="message-avatar">🤖</div>
                    <div class="message-content">
                        <div class="message-text">
                            Xin chào! Tôi là trợ lý ảo PedMed. Tôi có thể giúp bạn tìm hiểu về thuốc nhi khoa, liều lượng, chống chỉ định và các thông tin y tế liên quan. 
                            <br><br>
                            Bạn có thể hỏi tôi về:
                            <ul>
                                <li>Liều lượng thuốc cho trẻ em</li>
                                <li>Tác dụng phụ của thuốc</li>
                                <li>Chống chỉ định</li>
                                <li>Cách sử dụng thuốc</li>
                            </ul>
                        </div>
                        <div class="message-time">${getCurrentTime()}</div>
                    </div>
                </div>
            </div>
            
            <div class="chat-input-container">
                <div class="typing-indicator" id="typing-indicator" style="display: none;">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <div class="chat-input-wrapper">
                    <input type="text" id="chat-input" placeholder="Nhập câu hỏi..." maxlength="500">
                    <button id="chat-send" onclick="sendMessage()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(chatWidget);
}

// Show chat widget (when using HTML widget)
function showChatWidget() {
    const chatWidget = document.getElementById('chat-widget');
    if (chatWidget) {
        chatWidget.style.display = 'block';
        console.log('🤖 Chat widget shown after login');
    }
}

// Hide chat widget (when logout)
function hideChatWidget() {
    const chatWidget = document.getElementById('chat-widget');
    if (chatWidget) {
        chatWidget.style.display = 'none';
        // Also close the chat window if it's open
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow) {
            chatWindow.style.display = 'none';
        }
        isChatOpen = false;
        console.log('🤖 Chat widget hidden after logout');
    }
}

// Setup event listeners
function setupChatEventListeners() {
    const chatInput = document.getElementById('chat-input');
    const chatToggle = document.getElementById('chat-toggle');
    const chatSend = document.getElementById('chat-send');
    
    // Toggle chat on button click
    if (chatToggle) {
        chatToggle.addEventListener('click', toggleChat);
    }
    
    // Send button
    if (chatSend) {
        chatSend.addEventListener('click', sendMessage);
    }
    
    // Send message on Enter key
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Auto-resize input and character counter
        chatInput.addEventListener('input', function() {
            const length = this.value.length;
            if (length > 450) {
                this.style.borderColor = '#ff6b6b';
            } else {
                this.style.borderColor = '#ddd';
            }
        });
    }
    
    // Close chat when clicking outside
    document.addEventListener('click', function(e) {
        const chatWindow = document.getElementById('chat-window');
        const chatToggle = document.getElementById('chat-toggle');
        
        if (isChatOpen && !chatWindow.contains(e.target) && !chatToggle.contains(e.target)) {
            // Don't auto-close chat to prevent accidental closure
        }
    });
}

// Toggle chat window
function toggleChat() {
    const chatWindow = document.getElementById('chat-window');
    const chatToggle = document.getElementById('chat-toggle');
    const chatBadge = document.getElementById('chat-badge');
    
    // Check if elements exist
    if (!chatWindow || !chatToggle) {
        console.error('Chat elements not found');
        return;
    }
    
    isChatOpen = !isChatOpen;
    
    if (isChatOpen) {
        chatWindow.style.display = 'flex';
        chatToggle.classList.add('active');
        if (chatBadge) {
            chatBadge.style.display = 'none';
        }
        
        // Focus input
        setTimeout(() => {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.focus();
            }
        }, 300);
        
        // Scroll to bottom
        scrollChatToBottom();
    } else {
        chatWindow.style.display = 'none';
        chatToggle.classList.remove('active');
    }
}

// Send message
async function sendMessage() {
    const input = document.getElementById('chat-input');
    
    if (!input) {
        console.error('Chat input not found');
        return;
    }
    
    const message = input.value.trim();
    
    if (!message || isTyping) return;
    
    // Add user message
    addMessage(message, 'user');
    input.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Send to chatbot API
        const response = await fetch(`${BACKEND_URL}/api/chatbot/chat`, {
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
            // Add bot response (simplified without sources/confidence)
            addMessage(result.data.message, 'bot');
        } else {
            addMessage(result.message || 'Đã xảy ra lỗi. Vui lòng thử lại.', 'bot', { isError: true });
        }
        
    } catch (error) {
        console.error('Chat error:', error);
        addMessage('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.', 'bot', { isError: true });
    } finally {
        hideTypingIndicator();
    }
}

// Send suggestion (for suggestion buttons)
function sendSuggestion(suggestion) {
    const input = document.getElementById('chat-input');
    if (input && suggestion) {
        input.value = suggestion;
        sendMessage();
        
        // Hide suggestions after using one
        const suggestions = document.getElementById('chat-suggestions');
        if (suggestions) {
            suggestions.style.display = 'none';
        }
    }
}

// Add message to chat
function addMessage(text, sender, metadata = {}) {
    const messagesContainer = document.getElementById('chat-messages');
    
    if (!messagesContainer) {
        console.error('Messages container not found');
        return;
    }
    
    const messageDiv = document.createElement('div');
    
    const isBot = sender === 'bot';
    messageDiv.className = `message ${isBot ? 'bot-message' : 'user-message'}`;
    
    // Removed sources and confidence display as chatbot is trained on Google Drive documents
    
    messageDiv.innerHTML = `
        ${isBot ? '<div class="message-avatar">🤖</div>' : ''}
        <div class="message-content">
            <div class="message-text ${metadata.isError ? 'error-message' : ''}">${text}</div>
            <div class="message-time">${getCurrentTime()}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollChatToBottom();
    
    // Add to history
    chatHistory.push({
        text,
        sender,
        timestamp: new Date(),
        metadata
    });
}

// Show typing indicator
function showTypingIndicator() {
    isTyping = true;
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'flex';
        scrollChatToBottom();
    }
}

// Hide typing indicator
function hideTypingIndicator() {
    isTyping = false;
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'none';
    }
}

// Scroll chat to bottom
function scrollChatToBottom() {
    setTimeout(() => {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }, 100);
}

// Get current time
function getCurrentTime() {
    return new Date().toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Get logged in user
function getLoggedInUser() {
    try {
        return localStorage.getItem('loggedInUser');
    } catch {
        return null;
    }
}

// Show new message notification
function showChatNotification() {
    if (!isChatOpen) {
        const chatBadge = document.getElementById('chat-badge');
        if (chatBadge) {
            chatBadge.style.display = 'block';
        }
    }
}

// Export functions
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.sendSuggestion = sendSuggestion;
window.initializeChatbot = initializeChatbot;

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Ensure chatbot is hidden on page load
    const chatWidget = document.getElementById('chat-widget');
    if (chatWidget) {
        chatWidget.style.display = 'none';
        console.log('🤖 DOM loaded - chatbot hidden until login');
    }
    
    // Do NOT initialize chatbot automatically - only when user logs in
    console.log('🤖 Chatbot will initialize only after login');
});
