// Tự động detect môi trường
const BACKEND_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'https://pedmedvn.onrender.com'; // Backend Render URL

// Performance optimizations
const cache = new Map();
const requestCache = new Map();
let isOnline = navigator.onLine;

// Network status monitoring
window.addEventListener('online', () => {
  isOnline = true;

});

window.addEventListener('offline', () => {
  isOnline = false;

});

// Optimized fetch with caching and retry logic
async function optimizedFetch(url, options = {}, cacheKey = null, cacheDuration = 5 * 60 * 1000) {
  // Check cache first
  if (cacheKey && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < cacheDuration) {

      return { success: true, data: cached.data, fromCache: true };
    }
    cache.delete(cacheKey);
  }

  // Check for duplicate requests
  if (requestCache.has(url)) {

    return requestCache.get(url);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  const fetchPromise = (async () => {
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to get error message from response body
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse JSON, use default error message
        }
        return { success: false, error: errorMessage, status: response.status };
      }

      const data = await response.json();
      
      // Cache successful responses
      if (cacheKey && response.ok) {
        cache.set(cacheKey, { data, timestamp: Date.now() });

      }

      return { success: true, data, fromCache: false };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    } finally {
      requestCache.delete(url);
      clearTimeout(timeoutId);
    }
  })();

  requestCache.set(url, fetchPromise);
  return fetchPromise;
}

// Enhanced WebSocket connection with better error handling
function connectWebSocket(username, deviceId, maxRetries = 5) {
  let retries = 0;
  
  // Close existing connection if any
  if (window.ws && window.ws.readyState === WebSocket.OPEN) {

    window.ws.close();
  }

  const wsUrl = `${BACKEND_URL.replace('http', 'ws')}/?username=${encodeURIComponent(username)}&deviceId=${encodeURIComponent(deviceId)}`;


  function attemptConnection() {
    try {
      window.ws = new WebSocket(wsUrl);

      window.ws.onopen = () => {

        retries = 0; // Reset retries on success
      };

      window.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.action === "logout") {

            logout(true);
          }
        } catch (error) {
          console.warn('📩 Received non-JSON WebSocket message:', event.data);
        }
      };

      window.ws.onclose = (event) => {

        
        // Only retry if not intentionally closed and user is still logged in
        if (event.code !== 1000 && retries < maxRetries && localStorage.getItem("isLoggedIn") === "true") {

          const delay = Math.min(5000 * Math.pow(2, retries), 30000); // Exponential backoff, max 30s
          setTimeout(attemptConnection, delay);
          retries++;
        } else if (retries >= maxRetries) {
          console.error("🚨 Max WebSocket retries reached");
          // Don't auto-logout on WebSocket failure, let the app continue
        }
      };

      window.ws.onerror = (error) => {
        console.error("🚨 WebSocket error:", error);
        // Don't force logout on WebSocket errors
      };

    } catch (error) {
      console.error("🚨 Failed to create WebSocket:", error);
      if (retries < maxRetries) {
        setTimeout(attemptConnection, 5000);
        retries++;
      }
    }
  }

  attemptConnection();
}

// Hàm debounce tái sử dụng
function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

// Throttle function for scroll events
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// Kiểm tra session và kết nối WebSocket khi tải trang
document.addEventListener("DOMContentLoaded", async () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const loggedInUser = localStorage.getItem("loggedInUser");
    const { deviceId } = await getDeviceId(); // Lấy deviceId từ hardware fingerprint
  
    if (isLoggedIn === "true" && loggedInUser && deviceId) {
      const sessionValid = await checkSession();
      const loginScreen = document.getElementById("login-screen");
      const mainApp = document.getElementById("main-app");
      
      if (sessionValid) {
        if (loginScreen) loginScreen.style.display = "none";
        if (mainApp) mainApp.style.display = "block";
        connectWebSocket(loggedInUser, deviceId); // Kết nối WebSocket
      } else {
        if (loginScreen) loginScreen.style.display = "flex";
        if (mainApp) mainApp.style.display = "none";
      }
    } else {
      const loginScreen = document.getElementById("login-screen");
      const mainApp = document.getElementById("main-app");
      if (loginScreen) loginScreen.style.display = "flex";
      if (mainApp) mainApp.style.display = "none";
    }
  });

async function getDeviceId() {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          // IMPROVED: Sử dụng localStorage để đảm bảo tính nhất quán
          let storedDeviceId = localStorage.getItem('device_fingerprint');
          
          if (storedDeviceId) {
            console.log('📱 Using stored device ID:', storedDeviceId);
            resolve({ deviceId: storedDeviceId, deviceName: getDeviceName() });
            return;
          }
          
          // Tạo device ID mới chỉ khi chưa có
          // Sử dụng nhiều thông số ổn định hơn để tạo fingerprint
          
          // Platform info - chuẩn hóa
          let platformInfo = navigator.platform.toLowerCase();
          if (platformInfo.includes('win')) platformInfo = 'windows';
          else if (platformInfo.includes('mac')) platformInfo = 'macos';
          else if (platformInfo.includes('linux')) platformInfo = 'linux';
          else if (platformInfo.includes('android')) platformInfo = 'android';
          else if (platformInfo.includes('iphone') || platformInfo.includes('ipad')) platformInfo = 'ios';
          
          // User Agent hash - ổn định trong cùng browser
          let uaHash = 0;
          const ua = navigator.userAgent;
          for (let i = 0; i < ua.length; i++) {
            uaHash = ((uaHash << 5) - uaHash) + ua.charCodeAt(i);
            uaHash = uaHash & uaHash;
          }
          
          // Tạo signature từ nhiều thông số ổn định
          const stableSignature = [
            screen.width,
            screen.height,
            platformInfo,
            Math.abs(uaHash).toString(36).slice(0, 6), // UA hash ngắn gọn
            screen.colorDepth || 24,
            new Date().getTimezoneOffset() // Timezone offset
          ].join('|');
          
          console.log('🔐 Device fingerprint components:', {
            screen: `${screen.width}x${screen.height}`,
            platform: platformInfo,
            uaHash: Math.abs(uaHash).toString(36).slice(0, 6),
            colorDepth: screen.colorDepth || 24,
            timezone: new Date().getTimezoneOffset(),
            signature: stableSignature
          });
          
          // Tạo hash ổn định
          let hash = 0;
          for (let i = 0; i < stableSignature.length; i++) {
            const char = stableSignature.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
          }
          
          // Đảm bảo hash dương và có độ dài cố định
          const deviceId = Math.abs(hash).toString(36).padStart(8, '0').slice(0, 8);
          const deviceName = getDeviceName();
          
          // Lưu vào localStorage để đảm bảo tính nhất quán
          localStorage.setItem('device_fingerprint', deviceId);
          console.log('💾 Stored new device ID:', deviceId);
          
          resolve({ deviceId, deviceName });
          
        } catch (error) {
          console.error('❌ Error generating device ID:', error);
          // Fallback với localStorage backup
          try {
            let fallbackId = localStorage.getItem('device_fingerprint_backup');
            
            if (!fallbackId) {
              const screenSignature = `${screen.width}x${screen.height}x${Date.now()}`;
              let fallbackHash = 0;
              for (let i = 0; i < screenSignature.length; i++) {
                const char = screenSignature.charCodeAt(i);
                fallbackHash = ((fallbackHash << 5) - fallbackHash) + char;
                fallbackHash = fallbackHash & fallbackHash;
              }
              
              fallbackId = Math.abs(fallbackHash).toString(36).padStart(8, '0').slice(0, 8);
              localStorage.setItem('device_fingerprint_backup', fallbackId);
              localStorage.setItem('device_fingerprint', fallbackId);
            }

            resolve({ deviceId: fallbackId, deviceName: getDeviceName() });
            
          } catch (fallbackError) {
            console.error('❌ Even fallback failed:', fallbackError);
            // Emergency fallback với timestamp
            const emergencyId = (Date.now() % 1000000).toString(36).padStart(8, '0').slice(0, 8);
            localStorage.setItem('device_fingerprint', emergencyId);
            resolve({ deviceId: emergencyId, deviceName: getDeviceName() });
          }
        }
      }, 50);
    });
  }
function getDeviceName() {
    const ua = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();
    
    // Xác định loại thiết bị chi tiết hơn
    if (/iphone/.test(ua)) {
      // Cố gắng lấy model iPhone
      const match = ua.match(/iphone\s?os\s([\d_]+)/);
      const version = match ? match[1].replace(/_/g, '.') : 'Unknown';
      return `iPhone iOS ${version}`;
    }
    
    if (/ipad/.test(ua)) {
      const match = ua.match(/os\s([\d_]+)/);
      const version = match ? match[1].replace(/_/g, '.') : 'Unknown';
      return `iPad iOS ${version}`;
    }
    
    if (/android/.test(ua)) {
      const match = ua.match(/android\s([\d.]+)/);
      const version = match ? match[1] : 'Unknown';
      return `Android ${version}`;
    }
    
    // Desktop platforms
    if (/windows/.test(platform) || /win32/.test(platform) || /win64/.test(platform)) {
      if (/windows nt 10/.test(ua)) return 'Windows 10/11';
      if (/windows nt 6.3/.test(ua)) return 'Windows 8.1';
      if (/windows nt 6.2/.test(ua)) return 'Windows 8';
      if (/windows nt 6.1/.test(ua)) return 'Windows 7';
      return 'Windows PC';
    }
    
    if (/macintosh|mac os x/.test(ua)) {
      const match = ua.match(/mac os x ([\d_]+)/);
      const version = match ? match[1].replace(/_/g, '.') : 'Unknown';
      return `macOS ${version}`;
    }
    
    if (/linux/.test(platform)) {
      return 'Linux PC';
    }
    
    // Fallback
    return `${navigator.platform} Device`;
  }

// UI Helper Functions
function showSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = 'flex';
    } else {
        // Create spinner if it doesn't exist
        createLoadingSpinner();
    }
}

function hideSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

function createLoadingSpinner() {
    // Check if spinner already exists
    if (document.getElementById('loading-spinner')) return;
    
    const spinner = document.createElement('div');
    spinner.id = 'loading-spinner';
    spinner.innerHTML = `
        <div class="spinner-overlay">
            <div class="spinner-container">
                <div class="spinner"></div>
                <div class="spinner-text">Đang tải...</div>
            </div>
        </div>
    `;
    
    // Add spinner styles
    spinner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;
    
    const spinnerContainer = spinner.querySelector('.spinner-container');
    if (spinnerContainer) {
        spinnerContainer.style.cssText = `
            text-align: center;
            color: white;
        `;
    }
    
    const spinnerElement = spinner.querySelector('.spinner');
    if (spinnerElement) {
        spinnerElement.style.cssText = `
            border: 4px solid #f3f3f3;
            border-top: 4px solid #00b383;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        `;
    }
    
    // Add CSS animation
    if (!document.getElementById('spinner-styles')) {
        const style = document.createElement('style');
        style.id = 'spinner-styles';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(spinner);
}

// Performance monitoring utilities
const performanceMonitor = {
    // Log performance metrics
    logPerformance: function(operation, startTime) {
        if (typeof startTime === 'number') {
            const duration = performance.now() - startTime;

            
            // Store performance data (optional)
            if (typeof localStorage !== 'undefined') {
                try {
                    const perfData = JSON.parse(localStorage.getItem('perfMetrics') || '[]');
                    perfData.push({
                        operation,
                        duration,
                        timestamp: new Date().toISOString()
                    });
                    
                    // Keep only last 50 metrics
                    if (perfData.length > 50) {
                        perfData.splice(0, perfData.length - 50);
                    }
                    
                    localStorage.setItem('perfMetrics', JSON.stringify(perfData));
                } catch (error) {
                    console.warn('⚠️ Could not store performance metrics:', error);
                }
            }
        }
    },
    
    // Debounce function for performance optimization
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle function for performance optimization
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Get performance metrics from localStorage
    getMetrics: function() {
        try {
            return JSON.parse(localStorage.getItem('perfMetrics') || '[]');
        } catch (error) {
            console.warn('⚠️ Could not retrieve performance metrics:', error);
            return [];
        }
    },
    
    // Clear performance metrics
    clearMetrics: function() {
        try {
            localStorage.removeItem('perfMetrics');

        } catch (error) {
            console.warn('⚠️ Could not clear performance metrics:', error);
        }
    }
};

// Export functions for global use
window.optimizedFetch = optimizedFetch;
window.connectWebSocket = connectWebSocket;
window.getDeviceId = getDeviceId;

// Admin utility functions - chỉ dùng khi cần thiết
window.resetDeviceId = function() {
  localStorage.removeItem('device_fingerprint');
  localStorage.removeItem('device_fingerprint_backup');
  console.log('🔄 Device ID reset. Please refresh the page.');
  return 'Device ID đã được reset. Vui lòng tải lại trang.';
};

window.showCurrentDeviceId = async function() {
  const { deviceId, deviceName } = await getDeviceId();
  console.log('📱 Current Device Info:', { deviceId, deviceName });
  return { deviceId, deviceName };
};
window.performanceMonitor = performanceMonitor;
window.showSpinner = showSpinner;
window.hideSpinner = hideSpinner;
