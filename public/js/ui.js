// Performance optimized UI functions with throttling and lazy loading
let isAnimating = false;
let switchPageTimeout;

function switchPage(pageId) {
    console.log('🔄 Switching to page:', pageId);
    
    // Prevent rapid page switching
    if (isAnimating) {
        console.log('⚠️ Animation in progress, skipping');
        return;
    }
    
    clearTimeout(switchPageTimeout);
    switchPageTimeout = setTimeout(() => {
        performPageSwitch(pageId);
    }, 50);
}

function performPageSwitch(pageId) {
    console.log('🎯 Performing page switch to:', pageId);
    isAnimating = true;
    
    // Use requestAnimationFrame for smooth transitions
    requestAnimationFrame(() => {
        const allPages = document.querySelectorAll('.page');
        console.log('📄 Found pages:', allPages.length);
        
        allPages.forEach(page => {
            page.classList.remove('active');
        });

        const selectedPage = document.getElementById(pageId);
        console.log('🎯 Selected page:', selectedPage);
        
        if (selectedPage) {
            selectedPage.classList.add('active');
            console.log('✅ Page activated:', pageId);
            
            // Lazy load page content if needed
            lazyLoadPageContent(pageId);
        } else {
            console.error('❌ Page not found:', pageId);
        }

        updateActiveLink(pageId);
        
        const footer = document.querySelector("footer");
        if (footer) {
            footer.style.display = "block";
        }
        
        // Reset animation flag
        setTimeout(() => {
            isAnimating = false;
            console.log('🏁 Animation completed for:', pageId);
        }, 300);
    });
}

function updateActiveLink(pageId) {
    // Batch DOM updates
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const isActive = link.getAttribute('data-page') === pageId;
        link.classList.toggle('active', isActive);
    });
}

// Lazy loading for page content
function lazyLoadPageContent(pageId) {
    const page = document.getElementById(pageId);
    if (!page || page.dataset.loaded === 'true') return;
    
    // Mark as loaded to prevent re-loading
    page.dataset.loaded = 'true';
    
    // Add any specific lazy loading logic here
    console.log(`📦 Lazy loaded content for page: ${pageId}`);
}

// Throttled spinner functions
let spinnerTimeout;

function showSpinner() {
    clearTimeout(spinnerTimeout);
    const spinner = document.getElementById("spinner");
    if (spinner && spinner.style.display !== "block") {
        spinner.style.display = "block";
    }
}

function hideSpinner() {
    clearTimeout(spinnerTimeout);
    spinnerTimeout = setTimeout(() => {
        const spinner = document.getElementById("spinner");
        if (spinner) {
            spinner.style.display = "none";
        }
    }, 100); // Small delay to prevent flickering
}

// Optimized scroll handling
let ticking = false;

function handleScroll() {
    if (!ticking) {
        requestAnimationFrame(() => {
            // Add scroll-based optimizations here
            ticking = false;
        });
        ticking = true;
    }
}

// Add throttled scroll listener
if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScroll, { passive: true });
}

// Fallback simple page switch for compatibility
function simpleSwitchPage(pageId) {
    console.log('🔄 Simple switch to:', pageId);
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });

    // Show selected page
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.style.display = 'block';
        selectedPage.classList.add('active');
        console.log('✅ Simple switch successful:', pageId);
    } else {
        console.error('❌ Page not found:', pageId);
    }

    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });

    // Show footer
    const footer = document.querySelector("footer");
    if (footer) {
        footer.style.display = "block";
    }
}