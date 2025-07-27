// Version and Cache Management System
// Auto-generates cache busting parameters

class CacheManager {
    constructor() {
        // Generate unique version based on current time
        this.buildTime = Date.now();
        this.version = this.generateVersion();
        
        // Check for version updates periodically  
        this.checkInterval = 10 * 60 * 1000; // 10 minutes (reduced frequency)
        this.lastNotificationTime = 0; // Prevent duplicate notifications
        
        // Store current version in localStorage to compare after reload
        try {
            const lastSeenVersion = localStorage.getItem('pedmed_last_version');
            if (lastSeenVersion && lastSeenVersion !== this.version) {
                // Clear any leftover notifications from previous session
                setTimeout(() => this.clearNotifications(), 1000);
            }
            localStorage.setItem('pedmed_last_version', this.version);
        } catch (e) {
            // localStorage might not be available
        }
        
        this.startVersionCheck();
        
        // Only show version in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log(`🚀 PedMed Version: ${this.version}`);
        }
    }
    
    generateVersion() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        
        return `${year}${month}${day}${hour}${minute}`;
    }
    
    getCacheBustParam() {
        return `v=${this.version}&t=${this.buildTime}`;
    }
    
    // Force reload all cached resources
    forceReload() {
        if (window.location.hostname === 'localhost') {
            console.log('🔄 Force reloading application...');
        }
        
        // Clear any existing notifications first
        this.clearNotifications();
        
        // Clear all caches
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    registration.unregister();
                });
            });
        }
        
        // Clear localStorage/sessionStorage
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (e) {
            if (window.location.hostname === 'localhost') {
                console.warn('Could not clear storage:', e);
            }
        }
        
        // Reload with cache bust
        window.location.href = window.location.pathname + '?cachebust=' + Date.now();
    }
    
    // Clear all version notifications
    clearNotifications() {
        const notifications = document.querySelectorAll('.version-update-notification, .update-notification');
        notifications.forEach(notification => notification.remove());
    }
    
    // Check for version updates
    async checkForUpdates() {
        try {
            const response = await fetch('/version.json?t=' + Date.now(), {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const serverVersion = data.version;
                
                // More robust version comparison
                if (serverVersion && serverVersion !== this.version) {
                    const currentTime = Date.now();
                    
                    // Prevent duplicate notifications within 5 minutes
                    if (currentTime - this.lastNotificationTime > 5 * 60 * 1000) {
                        // Only show if server version is actually newer
                        if (parseInt(serverVersion) > parseInt(this.version)) {
                            if (window.location.hostname === 'localhost') {
                                console.log(`🆕 New version available: ${serverVersion} (current: ${this.version})`);
                            }
                            this.showUpdateNotification(serverVersion);
                            this.lastNotificationTime = currentTime;
                        }
                    }
                }
            }
        } catch (error) {
            // Silent fail in production
            if (window.location.hostname === 'localhost') {
                console.debug('Version check failed:', error.message);
            }
        }
    }
    
    showUpdateNotification(newVersion) {
        // Prevent duplicate notifications
        const existingNotification = document.querySelector('.version-update-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create update notification
        const notification = document.createElement('div');
        notification.className = 'version-update-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #00b383;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 300px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            animation: slideInFromRight 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong>🆕 Có phiên bản mới!</strong><br>
                <small>Cập nhật để sử dụng tính năng mới</small>
            </div>
            <button onclick="window.cacheManager.forceReload()" 
                    style="background: white; color: #00b383; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-weight: 600;">
                Cập nhật ngay
            </button>
            <button onclick="this.parentElement.remove()" 
                    style="background: transparent; color: white; border: 1px solid white; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-left: 5px;">
                Bỏ qua
            </button>
        `;
        
        // Add animation CSS if not exists
        if (!document.querySelector('#version-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'version-notification-styles';
            style.textContent = `
                @keyframes slideInFromRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 20 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideInFromRight 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 20000);
    }
    
    startVersionCheck() {
        // Check after page is fully loaded (reduced from 3s to 10s to avoid immediate conflicts)
        setTimeout(() => this.checkForUpdates(), 10000);
        
        // Then check periodically
        setInterval(() => this.checkForUpdates(), this.checkInterval);
    }
    
    // Get current app info
    getAppInfo() {
        return {
            version: this.version,
            buildTime: new Date(this.buildTime).toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
    }
}

// Initialize cache manager
window.cacheManager = new CacheManager();

// Only show version info in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('%c🏥 PedMed VNCH %c' + window.cacheManager.version, 
        'background: #00b383; color: white; padding: 2px 5px; border-radius: 3px', 
        'background: #333; color: white; padding: 2px 5px; border-radius: 3px');
}

// Expose version globally (but quietly)
window.PEDMED_VERSION = window.cacheManager.version;