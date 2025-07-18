// Version Management System
const APP_VERSION = {
  version: "2.1.0",
  buildNumber: "17528", 
  releaseDate: "2025-07-18",
  buildTime: "23:37:24"
};

// Add version info to footer
function addVersionToFooter() {
  const versionElement = document.getElementById('version-info');
  if (versionElement) {
    const cacheTimestamp = document.querySelector('meta[name="cache-bust"]')?.content || '';
    const shortTimestamp = cacheTimestamp.slice(-8);
    
    versionElement.innerHTML = `v${APP_VERSION.version} (Build #${APP_VERSION.buildNumber}) - ${shortTimestamp}`;
    
    versionElement.addEventListener('click', () => {
      const versionInfo = document.getElementById('version-info');
      if (versionInfo) {
        versionInfo.style.background = '#ffeb3b';
        versionInfo.style.color = '#000';
        versionInfo.style.padding = '5px';
        versionInfo.style.borderRadius = '3px';
        setTimeout(() => {
          versionInfo.style = '';
        }, 3000);
      }
    });
  }
}

// Initialize version system
function initVersionSystem() {
  addVersionToFooter();
  window.APP_VERSION = APP_VERSION;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVersionSystem);
} else {
  initVersionSystem();
}
