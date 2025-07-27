// Auto Version Update Script
// Updates version.json when files change

const fs = require('fs');
const path = require('path');

function generateVersion() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}${hour}${minute}`;
}

function updateVersionFile() {
    const versionData = {
        version: generateVersion(),
        buildTime: new Date().toISOString(),
        description: "PedMed VNCH - Session-based authentication, Groq AI default, Cache busting system",
        features: [
            "Session-based login",
            "Groq AI as default",
            "Enhanced cache management",
            "Auto version checking",
            "Improved performance"
        ]
    };
    
    const publicPath = path.join(__dirname, 'public');
    const versionPath = path.join(publicPath, 'version.json');
    
    try {
        fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
        console.log(`✅ Version updated to: ${versionData.version}`);
        console.log(`📁 File: ${versionPath}`);
        return versionData.version;
    } catch (error) {
        console.error('❌ Failed to update version file:', error);
        return null;
    }
}

// Run if called directly
if (require.main === module) {
    updateVersionFile();
}

module.exports = { updateVersionFile, generateVersion };
