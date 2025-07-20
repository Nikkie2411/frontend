// Performance optimized UI functions with throttling and lazy loading
let isAnimating = false;
let switchPageTimeout;

// Simple debounce function
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

function switchPage(pageId) {
    // Prevent rapid page switching
    if (isAnimating) {
        return;
    }
    
    isAnimating = true;
    const startTime = performance.now();
    
    try {
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            if (page.id !== pageId) {
                page.style.display = 'none';
                page.classList.remove('active');
            }
        });
        
        // Show target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.style.display = 'block';
            targetPage.classList.add('active');
            
            // Update navigation
            updateNavigation(pageId);
            
            // Lazy load content if needed
            lazyLoadPageContent(pageId);
        }
        
    } catch (error) {
        console.error('❌ Error switching page:', error);
    } finally {
        // Reset animation flag after a short delay
        setTimeout(() => {
            isAnimating = false;
        }, 100);
    }
}

function simpleSwitchPage(pageId) {
    // Clear any pending timeouts
    if (switchPageTimeout) {
        clearTimeout(switchPageTimeout);
    }
    
    // Debounce rapid clicks
    switchPageTimeout = setTimeout(() => {
        switchPage(pageId);
    }, 50);
}

function updateNavigation(activePageId) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const linkPageId = link.getAttribute('data-page');
        if (linkPageId === activePageId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function lazyLoadPageContent(pageId) {
    // Lazy load specific content based on page
    switch (pageId) {
        case 'tools-page':
            // Load tools content if not already loaded
            const toolsContent = document.querySelector('.tools-content');
            if (toolsContent && toolsContent.style.display === 'none') {
                // Keep tools hidden initially, they'll be shown when searched
            }
            break;
        case 'drug-info':
            // Ensure drug search is ready
            const searchInput = document.getElementById('search');
            if (searchInput && !searchInput.dataset.initialized) {
                // Initialize search if needed
                searchInput.dataset.initialized = 'true';
            }
            break;
    }
}

// Optimized scroll to section with smooth animation
function scrollToSection(sectionId) {
    const element = document.querySelector(sectionId);
    if (!element) {
        return;
    }
    
    // Ensure drug-details section is visible first
    const drugDetailsSection = document.getElementById('drug-details');
    if (drugDetailsSection) {
        if (drugDetailsSection.style.display === 'none' || drugDetailsSection.style.display === '') {
            drugDetailsSection.style.display = 'block';
        }
    }
    
    // Close mobile TOC if open
    closeMobileTOC();
    
    // Remove highlight from all sections first
    const allSections = document.querySelectorAll('.details-item');
    allSections.forEach(section => {
        section.classList.remove('highlight');
    });
    
    // Add highlight to current section
    const targetSection = element.closest('.details-item');
    if (targetSection) {
        targetSection.classList.add('highlight');
    }
    
    // Try simple scrollIntoView first
    try {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        });
    } catch (e) {
        // Fallback to manual scroll
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetY = rect.top + scrollTop - 100; // 100px offset
        
        window.scrollTo({
            top: targetY,
            behavior: 'smooth'
        });
    }
    
    // Update TOC active state
    updateTOCActiveState(sectionId);
}

// Update TOC active state
function updateTOCActiveState(activeSectionId) {
    const tocItems = document.querySelectorAll('#topics li');
    tocItems.forEach(item => {
        item.classList.remove('active');
        
        // Check if this TOC item corresponds to the active section
        const onclick = item.getAttribute('onclick');
        if (onclick && onclick.includes(activeSectionId)) {
            item.classList.add('active');
        }
    });
}

// Mobile TOC functions
function toggleMobileTOC() {
    const tocContainer = document.querySelector('.toc-container');
    const overlay = document.getElementById('toc-overlay');
    
    if (tocContainer && overlay) {
        const isOpen = tocContainer.classList.contains('mobile-open');
        
        if (isOpen) {
            closeMobileTOC();
        } else {
            openMobileTOC();
        }
    }
}

function openMobileTOC() {
    const tocContainer = document.querySelector('.toc-container');
    const overlay = document.getElementById('toc-overlay');
    
    if (tocContainer && overlay) {
        tocContainer.classList.add('mobile-open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function closeMobileTOC() {
    const tocContainer = document.querySelector('.toc-container');
    const overlay = document.getElementById('toc-overlay');
    
    if (tocContainer && overlay) {
        tocContainer.classList.remove('mobile-open');
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Event listeners for mobile TOC and initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize accordions
    initializeAccordions();
    
    // TOC toggle button
    const tocToggleBtn = document.querySelector('.toc-toggle-btn');
    if (tocToggleBtn) {
        tocToggleBtn.addEventListener('click', function() {
            toggleMobileTOC();
        });
    }
    
    // Overlay click to close
    const overlay = document.getElementById('toc-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeMobileTOC);
    }
    
    // Close TOC when clicking on a topic
    const topicLinks = document.querySelectorAll('#topics li');
    topicLinks.forEach(link => {
        link.addEventListener('click', () => {
            setTimeout(closeMobileTOC, 300); // Small delay for smooth UX
        });
    });
    
    // Handle window resize
    window.addEventListener('resize', debounce(() => {
        if (window.innerWidth > 768) {
            closeMobileTOC(); // Close mobile TOC on desktop
        }
    }, 250));
    
    // Handle clicks on modal backdrop
    const textModal = document.getElementById('textModal');
    if (textModal) {
        textModal.addEventListener('click', function(e) {
            if (e.target === textModal) {
                hideTextModal();
            }
        });
    }
    
    // Handle close buttons in modal
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-bs-dismiss="modal"]') || 
            e.target.matches('.btn-close') ||
            e.target.closest('[data-bs-dismiss="modal"]')) {
            hideTextModal();
        }
    });
    
    // Handle escape key for modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideTextModal();
        }
    });
    
    // Handle dynamic content accordion initialization
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        const accordionButtons = node.querySelectorAll ? node.querySelectorAll('.accordion-button') : [];
                        if (accordionButtons.length > 0) {
                            initializeAccordions();
                        }
                    }
                });
            }
        });
    });
    
    // Observe changes in drug details section
    const drugDetails = document.getElementById('drug-details');
    if (drugDetails) {
        observer.observe(drugDetails, { childList: true, subtree: true });
    }
});

// Optimized show/hide functions
const showElement = (element, displayType = 'block') => {
    if (element) {
        element.style.display = displayType;
        element.classList.add('visible');
    }
};

const hideElement = (element) => {
    if (element) {
        element.style.display = 'none';
        element.classList.remove('visible');
    }
};

// Accordion functionality
function initializeAccordions() {
    const accordionButtons = document.querySelectorAll('.accordion-button');
    
    accordionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            
            // Close all other accordions in the same container
            const container = this.closest('.accordion-container') || document;
            const allButtons = container.querySelectorAll('.accordion-button');
            const allContents = container.querySelectorAll('.accordion-content');
            
            allButtons.forEach(btn => {
                btn.setAttribute('aria-expanded', 'false');
                btn.classList.remove('active');
            });
            
            allContents.forEach(content => {
                content.style.display = 'none';
            });
            
            // Toggle current accordion
            if (!isExpanded && content) {
                this.setAttribute('aria-expanded', 'true');
                this.classList.add('active');
                content.style.display = 'block';
            }
        });
    });
}

// Modal functionality for text content
function showTextModal(title, content) {
    const modal = document.getElementById('textModal');
    const modalTitle = document.getElementById('textModalLabel');
    const modalContent = document.getElementById('modalContent');
    
    if (modal && modalTitle && modalContent) {
        modalTitle.textContent = title || 'Thông tin chi tiết';
        
        // Process content to preserve line breaks
        let processedContent = content || 'Chưa có thông tin';
        
        // Replace various line break patterns with HTML <br> tags
        processedContent = processedContent
            .replace(/\r\n/g, '<br>')  // Windows line breaks
            .replace(/\n/g, '<br>')    // Unix line breaks
            .replace(/\r/g, '<br>')    // Mac line breaks
            .replace(/\\n/g, '<br>');  // Escaped line breaks
        
        modalContent.innerHTML = processedContent;
        
        // Show modal with custom styling
        modal.style.display = 'block';
        modal.classList.add('show');
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'; // Darker backdrop
        document.body.style.overflow = 'hidden';
        
        // Add animation
        const modalDialog = modal.querySelector('.modal-dialog');
        if (modalDialog) {
            modalDialog.style.transform = 'translateY(-50px)';
            modalDialog.style.opacity = '0';
            setTimeout(() => {
                modalDialog.style.transform = 'translateY(0)';
                modalDialog.style.opacity = '1';
            }, 10);
        }
    }
}

function hideTextModal() {
    const modal = document.getElementById('textModal');
    if (modal) {
        const modalDialog = modal.querySelector('.modal-dialog');
        
        // Add close animation
        if (modalDialog) {
            modalDialog.style.transform = 'translateY(-50px)';
            modalDialog.style.opacity = '0';
        }
        
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('show');
            modal.style.backgroundColor = '';
            document.body.style.overflow = '';
        }, 200);
    }
}

// Export functions for global use
window.switchPage = switchPage;
window.simpleSwitchPage = simpleSwitchPage;
window.scrollToSection = scrollToSection;
window.toggleMobileTOC = toggleMobileTOC;
window.showElement = showElement;
window.hideElement = hideElement;
window.showTextModal = showTextModal;
window.hideTextModal = hideTextModal;
window.initializeAccordions = initializeAccordions;
