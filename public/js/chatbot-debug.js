// Debug script for chatbot widget
console.log('🔧 Debugging Chatbot Widget...');

// Check if DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM Content Loaded');
    
    // Check for chat elements
    const elements = [
        'chat-widget',
        'chat-toggle', 
        'chat-window',
        'chat-messages',
        'chat-input',
        'chat-send',
        'typing-indicator'
    ];
    
    console.log('🔍 Checking chat elements:');
    elements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            console.log(`✅ ${elementId}: Found`);
        } else {
            console.log(`❌ ${elementId}: NOT FOUND`);
        }
    });
    
    // Test toggleChat function
    console.log('🧪 Testing toggleChat function...');
    
    // Override toggleChat with debug version
    window.debugToggleChat = function() {
        console.log('🎯 debugToggleChat called');
        
        const chatWindow = document.getElementById('chat-window');
        const chatToggle = document.getElementById('chat-toggle');
        const chatBadge = document.getElementById('chat-badge');
        
        console.log('Elements found:', {
            chatWindow: !!chatWindow,
            chatToggle: !!chatToggle, 
            chatBadge: !!chatBadge
        });
        
        if (!chatWindow) {
            console.error('❌ chat-window not found!');
            return;
        }
        
        if (!chatToggle) {
            console.error('❌ chat-toggle not found!');
            return;
        }
        
        // Toggle logic
        const isCurrentlyOpen = chatWindow.style.display === 'flex';
        console.log('Current state:', isCurrentlyOpen ? 'OPEN' : 'CLOSED');
        
        if (isCurrentlyOpen) {
            chatWindow.style.display = 'none';
            chatToggle.classList.remove('active');
            console.log('✅ Chat closed');
        } else {
            chatWindow.style.display = 'flex';
            chatToggle.classList.add('active');
            if (chatBadge) {
                chatBadge.style.display = 'none';
            }
            console.log('✅ Chat opened');
        }
    };
    
    console.log('🎮 Debug commands available:');
    console.log('- debugToggleChat() - Test chat toggle');
    console.log('- Use browser console to test');
});

// Override original toggleChat for debugging
const originalToggleChat = window.toggleChat;
window.toggleChat = function() {
    console.log('🎯 toggleChat called');
    try {
        if (originalToggleChat) {
            originalToggleChat();
            console.log('✅ Original toggleChat executed');
        } else {
            console.log('⚠️ Original toggleChat not found, using debug version');
            window.debugToggleChat();
        }
    } catch (error) {
        console.error('❌ Error in toggleChat:', error);
    }
};
