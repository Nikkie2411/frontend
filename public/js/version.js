// Version Management System
const APP_VERSION = {
  version: "2.1.0",
  buildNumber: "17528", 
  releaseDate: "2025-07-18",
  buildTime: "00:03:57",
  features: [
    "Sticky Drug Header",
    "Improved TOC Navigation", 
    "Enhanced Cache Busting",
    "Mobile Responsive Design",
    "Advanced Search with Caching"
  ],
  changelog: {
    "2.1.0": [
      "🔧 Fixed scroll to section functionality",
      "🎨 Enhanced sticky header layout",
      "📱 Improved mobile interface",
      "⚡ Optimized cache management"
    ],
    "2.0.0": [
      "🚀 Major UI redesign",
      "🔄 Implemented cache busting system",
      "📋 Added table of contents navigation",
      "🎯 Enhanced drug search functionality"
    ]
  }
};

// Display version info in console
function displayVersionInfo() {
  console.clear();
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                          PEDMED VNCH                             ║
║                    Version Information                           ║
╠══════════════════════════════════════════════════════════════════╣
║ Version: ${APP_VERSION.version}                                         ║
║ Build: #${APP_VERSION.buildNumber}                                      ║
║ Release Date: ${APP_VERSION.releaseDate}                              ║
║ Build Time: ${APP_VERSION.buildTime}                                   ║
║ Cache Timestamp: ${document.querySelector('meta[name="cache-bust"]')?.content || 'N/A'} ║
╚══════════════════════════════════════════════════════════════════╝
  `);
  
  console.log("🚀 Features in this version:");
  APP_VERSION.features.forEach(feature => {
    console.log(`  ✅ ${feature}`);
  });
  
  console.log("\n📋 Recent Changes:");
  if (APP_VERSION.changelog[APP_VERSION.version]) {
    APP_VERSION.changelog[APP_VERSION.version].forEach(change => {
      console.log(`  ${change}`);
    });
  }
  
  console.log(`\n🔧 Debug Mode: ${location.hostname === 'localhost' ? 'ON' : 'OFF'}`);
  console.log(`🌐 Environment: ${location.hostname === 'localhost' ? 'Development' : 'Production'}`);
  console.log(`📱 Device: ${window.innerWidth <= 768 ? 'Mobile' : 'Desktop'}`);
  console.log(`⏰ Load Time: ${new Date().toLocaleString()}`);
}

// Check for version updates
function checkVersionUpdate() {
  const lastVersion = localStorage.getItem('pedmed_last_version');
  const currentVersion = APP_VERSION.version;
  
  if (lastVersion && lastVersion !== currentVersion) {
    console.log(`🔄 Version updated from ${lastVersion} to ${currentVersion}`);
    
    // Show update notification
    showUpdateNotification(lastVersion, currentVersion);
  }
  
  localStorage.setItem('pedmed_last_version', currentVersion);
}

// Show update notification
function showUpdateNotification(oldVersion, newVersion) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #00b383, #007a61);
    color: white;
    padding: 15px 20px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 179, 131, 0.3);
    z-index: 10000;
    font-family: Arial, sans-serif;
    max-width: 300px;
    animation: slideIn 0.5s ease-out;
  `;
  
  notification.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px;">
      🚀 Cập nhật mới!
    </div>
    <div style="font-size: 14px; opacity: 0.9;">
      Phiên bản ${newVersion} đã được cài đặt
    </div>
    <div style="font-size: 12px; margin-top: 8px; opacity: 0.8;">
      Click để xem chi tiết
    </div>
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  // Add click handler
  notification.addEventListener('click', () => {
    console.log("📋 Version Details:");
    if (APP_VERSION.changelog[newVersion]) {
      APP_VERSION.changelog[newVersion].forEach(change => {
        console.log(`  ${change}`);
      });
    }
    notification.remove();
  });
  
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideIn 0.5s ease-out reverse';
      setTimeout(() => notification.remove(), 500);
    }
  }, 5000);
}

// Add version badge to page (optional)
function addVersionBadge() {
  if (location.hostname === 'localhost' || location.search.includes('debug=true')) {
    const badge = document.createElement('div');
    badge.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 12px;
      font-family: monospace;
      z-index: 9999;
      cursor: pointer;
    `;
    badge.textContent = `v${APP_VERSION.version} #${APP_VERSION.buildNumber}`;
    badge.title = 'Click for version details';
    
    badge.addEventListener('click', displayVersionInfo);
    document.body.appendChild(badge);
  }
}

// Initialize version system
function initVersionSystem() {
  displayVersionInfo();
  checkVersionUpdate();
  addVersionBadge();
  
  // Add global function for manual version check
  window.showVersion = displayVersionInfo;
  window.APP_VERSION = APP_VERSION;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVersionSystem);
} else {
  initVersionSystem();
}

// Export for use in other files
window.VersionManager = {
  displayVersionInfo,
  checkVersionUpdate,
  APP_VERSION
};
