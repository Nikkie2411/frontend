// Auto Cache Busting Integration
// This script immediately applies cache busting parameters

(function() {
    'use strict';
    
    // Only show cache busting info in development
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDev) {
        console.log('🔄 Auto cache busting initializing...');
    }
    
    // Generate timestamp for this load
    const loadTimestamp = Date.now();
    const buildVersion = new Date().toISOString().slice(0,16).replace(/[-:T]/g, '');
    
    // Function to add cache busting to URLs
    function addCacheBust(url) {
        if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;
        
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}v=${buildVersion}&t=${loadTimestamp}`;
    }
    
    // Update existing script tags
    function updateScriptTags() {
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            const src = script.getAttribute('src');
            if (src && !src.includes('?') && !src.startsWith('http')) {
                script.src = addCacheBust(src);
                if (isDev) {
                    console.log('📝 Updated script:', src, '→', script.src);
                }
            }
        });
    }
    
    // Update existing link tags
    function updateLinkTags() {
        const links = document.querySelectorAll('link[rel="stylesheet"][href]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.includes('?') && !href.startsWith('http')) {
                link.href = addCacheBust(href);
                if (isDev) {
                    console.log('🎨 Updated stylesheet:', href, '→', link.href);
                }
            }
        });
    }
    
        // Listen for service worker messages
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', event => {
                const { type, version, action } = event.data;
                
                if (type === 'VERSION_UPDATED' && action === 'REFRESH_REQUIRED') {
                    if (isDev) {
                        console.log('🆕 Service Worker detected new version:', version);
                    }
                    
                    // Show subtle update notification
                    showUpdateNotification(version);
                }
            });
        }    function showUpdateNotification(version) {
        // Don't show multiple notifications
        if (document.querySelector('.update-notification')) return;
        
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #00b383, #00a078);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,179,131,0.3);
            z-index: 10001;
            font-size: 14px;
            max-width: 280px;
            animation: slideIn 0.3s ease-out;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">🔄</span>
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 2px;">Có cập nhật mới!</div>
                    <div style="font-size: 12px; opacity: 0.9;">Nhấn để tải lại</div>
                </div>
            </div>
        `;
        
        // Add animation keyframes
        if (!document.querySelector('#update-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'update-notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .update-notification:hover {
                    transform: scale(1.02);
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }
            `;
            document.head.appendChild(style);
        }
        
        notification.addEventListener('click', () => {
            window.location.reload(true);
        });
        
        document.body.appendChild(notification);
        
        // Auto remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 10000);
    }
    
    // Apply immediately if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            updateScriptTags();
            updateLinkTags();
        });
    } else {
        updateScriptTags();
        updateLinkTags();
    }
    
    if (isDev) {
        console.log('✅ Auto cache busting ready');
    }
    
    // Expose utilities globally
    window.cacheBustUtils = {
        addCacheBust,
        updateScriptTags,
        updateLinkTags,
        buildVersion,
        loadTimestamp
    };
    
})();
