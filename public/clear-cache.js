// Force Cache Clear Script
console.log('🔄 Force clearing all caches...');

// Function to clear everything and reload
async function forceClearAndReload() {
    try {
        // 1. Clear Service Worker caches
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log(`Found ${registrations.length} service workers`);
            for (const registration of registrations) {
                await registration.unregister();
                console.log('Unregistered service worker');
            }
        }

        // 2. Clear all browser caches
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            console.log(`Found ${cacheNames.length} caches:`, cacheNames);
            for (const cacheName of cacheNames) {
                console.log('Deleting cache:', cacheName);
                await caches.delete(cacheName);
            }
        }

        // 3. Clear storage
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ Storage cleared');

        // 4. Clear IndexedDB
        if ('indexedDB' in window) {
            indexedDB.deleteDatabase('pedmed-cache');
            console.log('✅ IndexedDB cleared');
        }

        console.log('🚀 Cache clearing complete. Reloading...');
        
        // 5. Force reload with cache bust
        window.location.href = window.location.pathname + '?v=' + Date.now() + '&cachebust=true';
        
    } catch (error) {
        console.error('Error clearing cache:', error);
        // Fallback reload
        window.location.reload(true);
    }
}

// Auto execute
forceClearAndReload();
