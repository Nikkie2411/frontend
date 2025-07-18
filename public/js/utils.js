// Tự động detect môi trường
const BACKEND_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'https://pedmedvn.onrender.com'; // URL Render mới

// Performance optimizations
const cache = new Map();
const requestCache = new Map();
let isOnline = navigator.onLine;

// Network status monitoring
window.addEventListener('online', () => {
  isOnline = true;
  console.log('🌐 Network connection restored');
});

window.addEventListener('offline', () => {
  isOnline = false;
  console.log('📶 Network connection lost');
});

// Optimized fetch with caching and retry logic
async function optimizedFetch(url, options = {}, cacheKey = null, cacheDuration = 5 * 60 * 1000) {
  // Check cache first
  if (cacheKey && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < cacheDuration) {
      console.log(`📦 Cache hit: ${cacheKey}`);
      return { success: true, data: cached.data, fromCache: true };
    }
    cache.delete(cacheKey);
  }

  // Check for duplicate requests
  if (requestCache.has(url)) {
    console.log(`⏳ Request in progress: ${url}`);
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache successful responses
      if (cacheKey && response.ok) {
        cache.set(cacheKey, { data, timestamp: Date.now() });
        console.log(`💾 Cached: ${cacheKey}`);
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
    console.log('🔌 Closing existing WebSocket connection');
    window.ws.close();
  }

  const wsUrl = `${BACKEND_URL.replace('http', 'ws')}/?username=${encodeURIComponent(username)}&deviceId=${encodeURIComponent(deviceId)}`;
  console.log('🔗 Attempting WebSocket connection to:', wsUrl);

  function attemptConnection() {
    try {
      window.ws = new WebSocket(wsUrl);

      window.ws.onopen = () => {
        console.log(`✅ WebSocket connected for ${username}_${deviceId.substring(0, 8)}***`);
        retries = 0; // Reset retries on success
      };

      window.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📩 WebSocket message:", data);
          if (data.action === "logout") {
            console.log("⚠️ Received logout signal:", data.message);
            logout(true);
          }
        } catch (error) {
          console.warn('📩 Received non-JSON WebSocket message:', event.data);
        }
      };

      window.ws.onclose = (event) => {
        console.log(`🔌 WebSocket disconnected (code: ${event.code}, reason: ${event.reason})`);
        
        // Only retry if not intentionally closed and user is still logged in
        if (event.code !== 1000 && retries < maxRetries && localStorage.getItem("isLoggedIn") === "true") {
          console.log(`� Retrying WebSocket connection (${retries + 1}/${maxRetries})...`);
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
          // Chỉ sử dụng 3 thông tin cơ bản nhất và ổn định nhất
          // để đảm bảo tính nhất quán tuyệt đối giữa browsers
          
          // Platform info - chuẩn hóa
          let platformInfo = navigator.platform.toLowerCase();
          if (platformInfo.includes('win')) platformInfo = 'windows';
          else if (platformInfo.includes('mac')) platformInfo = 'macos';
          else if (platformInfo.includes('linux')) platformInfo = 'linux';
          else if (platformInfo.includes('android')) platformInfo = 'android';
          else if (platformInfo.includes('iphone') || platformInfo.includes('ipad')) platformInfo = 'ios';
          
          // Chỉ sử dụng 3 thông tin cơ bản nhất:
          // 1. Screen width
          // 2. Screen height  
          // 3. Platform (normalized)
          const ultraSimpleSignature = [
            screen.width,
            screen.height,
            platformInfo
          ].join('|');
          
          console.log('🔧 Ultra-simple signature:', {
            screen: `${screen.width}x${screen.height}`,
            platform: platformInfo,
            signature: ultraSimpleSignature
          });
          
          // Tạo hash đơn giản
          let hash = 0;
          for (let i = 0; i < ultraSimpleSignature.length; i++) {
            const char = ultraSimpleSignature.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
          }
          
          // Đảm bảo hash dương và có độ dài cố định
          const deviceId = Math.abs(hash).toString(36).padStart(8, '0').slice(0, 8);
          const deviceName = getDeviceName();
          
          resolve({ deviceId, deviceName });
          
        } catch (error) {
          console.error('❌ Error generating device ID:', error);
          // Fallback chỉ dùng screen resolution
          try {
            const screenSignature = `${screen.width}x${screen.height}`;
            let fallbackHash = 0;
            for (let i = 0; i < screenSignature.length; i++) {
              const char = screenSignature.charCodeAt(i);
              fallbackHash = ((fallbackHash << 5) - fallbackHash) + char;
              fallbackHash = fallbackHash & fallbackHash;
            }
            
            const fallbackId = Math.abs(fallbackHash).toString(36).padStart(8, '0').slice(0, 8);
            console.log(`🔄 Using screen-only fallback: ${fallbackId}`);
            resolve({ deviceId: fallbackId, deviceName: getDeviceName() });
            
          } catch (fallbackError) {
            console.error('❌ Even fallback failed:', fallbackError);
            // Emergency fallback
            const emergencyId = (screen.width * screen.height).toString(36).padStart(8, '0').slice(0, 8);
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
