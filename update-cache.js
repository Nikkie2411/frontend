// Script để tự động cập nhật cache busting timestamp và version
const fs = require('fs');
const path = require('path');

function updateVersionInfo() {
    const versionPath = path.join(__dirname, 'public', 'js', 'version.js');
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const buildNumber = Math.floor(Date.now() / 100000000);
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];
    
    // Read current version.js to extract version number
    let versionContent = fs.readFileSync(versionPath, 'utf8');
    
    // Update build info in version.js
    versionContent = versionContent.replace(
        /buildNumber: "\d+"/g,
        `buildNumber: "${buildNumber}"`
    );
    
    versionContent = versionContent.replace(
        /releaseDate: "[^"]*"/g,
        `releaseDate: "${currentDate}"`
    );
    
    versionContent = versionContent.replace(
        /buildTime: "[^"]*"/g,
        `buildTime: "${currentTime}"`
    );
    
    fs.writeFileSync(versionPath, versionContent);
    
    return { timestamp, buildNumber, currentDate, currentTime };
}

function updateCacheBust() {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    const swPath = path.join(__dirname, 'public', 'sw.js');
    
    // Update version info first
    const { timestamp, buildNumber } = updateVersionInfo();
    
    console.log(`🔄 Updating cache bust to: ${timestamp}`);
    console.log(`📝 Version: ${buildNumber}`);
    
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Update cache-bust meta tag
    content = content.replace(
        /<meta name="cache-bust" content="[^"]*">/g,
        `<meta name="cache-bust" content="${timestamp}">`
    );
    
    // Update CSS version and bust parameter with timestamp
    content = content.replace(
        /\/css\/styles\.css\?v=\d+&bust=\d+(&nocache=true)?(&ts=\d+)?/g,
        `/css/styles.css?v=${buildNumber}&bust=${timestamp}&nocache=true&ts=${timestamp}`
    );
    
    // Update JS files version and bust parameter with timestamp
    content = content.replace(
        /\/js\/(\w+)\.js\?v=\d+&bust=\d+(&nocache=true)?(&ts=\d+)?/g,
        `/js/$1.js?v=${buildNumber}&bust=${timestamp}&nocache=true&ts=${timestamp}`
    );
    
    // Update CURRENT_VERSION in script
    content = content.replace(
        /const CURRENT_VERSION = '[^']*';/,
        `const CURRENT_VERSION = '${buildNumber}';`
    );
    
    // Update CACHE_BUST in script
    content = content.replace(
        /const CACHE_BUST = '[^']*';/,
        `const CACHE_BUST = '${timestamp}';`
    );
    
    fs.writeFileSync(indexPath, content, 'utf8');
    
    // Update Service Worker cache name
    let swContent = fs.readFileSync(swPath, 'utf8');
    const swVersion = 'v1.7'; // Increment manually when major changes
    
    swContent = swContent.replace(
        /const CACHE_NAME = '[^']*';/,
        `const CACHE_NAME = 'pedmed-${swVersion}-${timestamp}';`
    );
    
    fs.writeFileSync(swPath, swContent, 'utf8');
    
    console.log('✅ Cache bust updated successfully!');
    console.log(`📝 New version: ${buildNumber}`);
    console.log(`⏰ New timestamp: ${timestamp}`);
    console.log(`🚀 Version info updated in version.js`);
    console.log(`🔧 Service Worker cache updated to: pedmed-${swVersion}-${timestamp}`);
}

// Chạy script
updateCacheBust();
