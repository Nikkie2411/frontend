// Utility functions for PedMed application

// Backend URL configuration
const BACKEND_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'https://pedmedvn.onrender.com';

// Online status tracking
let isOnline = navigator.onLine;
window.addEventListener('online', () => isOnline = true);
window.addEventListener('offline', () => isOnline = false);

// Debounce function
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Optimized fetch function with better error handling and retry
async function optimizedFetch(url, options = {}, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Wake up backend if it's sleeping (for free tier services)
      if (url.includes('/api/login') && !window.backendAwake) {
        try {
          console.log('🔄 Waking up backend...');
          await fetch(`${BACKEND_URL}/api/ping`, { 
            method: 'GET',
            mode: 'cors',
            credentials: 'include'
          });
          
          // Wait a bit for backend to fully start
          console.log('⏳ Waiting for backend to stabilize...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          window.backendAwake = true;
          console.log('✅ Backend is ready');
        } catch (wakeError) {
          console.log('⚠️ Could not wake backend:', wakeError);
          // Continue anyway, maybe it's already awake
        }
      }

      const response = await fetch(url, {
        ...options,
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        }
      });
      
      if (!response.ok) {
        // Handle specific HTTP status codes
        if (response.status === 502) {
          throw new Error('Backend service temporarily unavailable (502)');
        } else if (response.status === 503) {
          throw new Error('Service temporarily unavailable (503)');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      
      return await response.json();
      
    } catch (error) {
      console.log(`❌ Attempt ${attempt + 1} failed:`, error.message);
      
      // Handle different types of errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        // This could be CORS, network, or server sleeping
        if (attempt < maxRetries) {
          console.log(`🔄 Retrying in 3 seconds... (CORS/Network error)`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        } else {
          throw new Error('Cannot connect to server - CORS or network issue');
        }
      } else if (error.message.includes('502') || error.message.includes('503')) {
        if (!isOnline) {
          throw new Error('No internet connection');
        } else if (attempt < maxRetries) {
          console.log(`🔄 Retrying in 3 seconds... (${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue; // Retry
        } else {
          throw new Error('Cannot connect to server - CORS or network issue');
        }
      }
      
      // For other errors, don't retry
      throw error;
    }
  }
}

// Simple loading spinner control
function showSpinner() {
  const spinner = document.getElementById('spinner');
  if (spinner) spinner.style.display = 'flex';
}

function hideSpinner() {
  const spinner = document.getElementById('spinner');
  if (spinner) spinner.style.display = 'none';
}

// Check authentication on page load  
function checkAuth() {
  // Auth object will be defined in auth.js
  const spinner = document.getElementById('spinner');
  if (spinner) spinner.style.display = 'none';
}
