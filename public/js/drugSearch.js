// Enhanced drug search functionality with optimized performance
let currentResults = [];
let searchTimeout;
let isSearching = false;

async function searchDrugs(query, resultsContainerId = 'search-results') {
    if (!query || query.trim().length < 2) {
        // Clear UI and results when no valid query
        const resultsContainer = document.getElementById(resultsContainerId);
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
        }
        if (resultsContainerId === 'search-results') {
            currentResults = []; // Only clear results for main search
        }
        return;
    }

    if (isSearching) {
        clearTimeout(searchTimeout);
    }

    isSearching = true;
    showLoading(resultsContainerId);

    searchTimeout = setTimeout(async () => {
        try {
            const startTime = performance.now();

            const result = await optimizedFetch(`${BACKEND_URL}/api/drugs?query=${encodeURIComponent(query.trim())}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!result.success) {
                throw new Error('API call failed');
            }

            const data = result.data;
            const rawResults = data.data || []; // Backend trả về 'data' không phải 'results'
            
            // Transform backend data format to frontend format
            currentResults = rawResults.map((drug, index) => ({
                id: index, // Use array index as id
                name: drug['Hoạt chất'] || 'Không rõ tên',
                activeIngredient: drug['Hoạt chất'] || '',
                indication: drug['Phân loại dược lý'] || '',
                dosage: drug['Liều thông thường trẻ em'] || drug['Liều thông thường trẻ sơ sinh'] || '',
                contraindication: drug['Chống chỉ định'] || '',
                sideEffects: drug['Tác dụng không mong muốn'] || '',
                dosageForm: drug['Cách dùng (ngoài IV)'] || '',
                category: 'Thuốc kê đơn', // Default category
                price: 'Liên hệ',
                inStock: true,
                insurance: drug['Bảo hiểm y tế thanh toán'] || '',
                kidneyAdjustment: drug['Hiệu chỉnh liều theo chức năng thận'] || '',
                liverAdjustment: drug['Hiệu chỉnh liều theo chức năng gan'] || '',
                drugInteractions: drug['Tương tác thuốc chống chỉ định'] || '',
                monitoring: drug['Các thông số cần theo dõi'] || '',
                overdose: drug['Ngộ độc/Quá liều'] || '',
                lastUpdated: drug['Cập nhật'] || ''
            }));
            
            performanceMonitor.logPerformance(`Drug search for "${query}"`, startTime);
            displayResults(currentResults, query, resultsContainerId);

        } catch (error) {
            displayError('Lỗi tìm kiếm. Vui lòng thử lại.', resultsContainerId);
        } finally {
            hideLoading(resultsContainerId);
            isSearching = false;
        }
    }, 300); // Debounce 300ms
}

function displayResults(results, query, resultsContainerId = 'search-results') {
    const resultsContainer = document.getElementById(resultsContainerId);
    
    if (!resultsContainer) {
        return;
    }

    // Show the results container
    resultsContainer.style.display = 'block';

    if (!results || results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <p>Không tìm thấy kết quả cho "${query}"</p>
            </div>
        `;
        return;
    }

    // Simple list showing only drug names (active ingredients)
    let html = '';
    results.slice(0, 10).forEach(drug => { // Limit to 10 results for dropdown
        html += `
            <div class="search-result-item" onclick="selectDrug('${drug.id}', '${drug.name.replace(/'/g, "\\'")}')">
                ${highlightSearchTerm(drug.name, query)}
            </div>
        `;
    });

    resultsContainer.innerHTML = html;
}

function highlightSearchTerm(text, term) {
    if (!text || !term) return text;
    
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

async function showDrugDetail(drugId) {
    if (drugId === undefined || drugId === null) return;
    
    try {
        showSpinner();
        
        // Find the drug in current results using exact match
        const drug = currentResults.find(d => d.id === parseInt(drugId));
        if (!drug) {
            throw new Error('Drug not found in current results');
        }
        
        displayDrugDetail(drug);
        
    } catch (error) {
        alert('Không thể tải thông tin chi tiết thuốc.');
    } finally {
        hideSpinner();
    }
}

function displayDrugDetail(drug) {
    // Show the drug details section
    const detailsSection = document.getElementById('drug-details');
    const drugNameElement = document.getElementById('drug-name');
    
    if (!detailsSection || !drugNameElement) {
        return;
    }
    
    // Set the drug name (allow HTML formatting)
    drugNameElement.innerHTML = drug.name;
    
    // Update all the detail sections with HTML content
    updateDetailSection('drug-capnhat', drug.lastUpdated);
    updateDetailSection('drug-phanloaiduocly', drug.indication);
    updateDetailSection('drug-lieutresosinh', drug.dosage);
    updateDetailSection('drug-lieutreem', drug.dosage);
    updateDetailSection('drug-hieuchinhCNthan', drug.kidneyAdjustment);
    updateDetailSection('drug-hieuchinhCNgan', drug.liverAdjustment);
    updateDetailSection('drug-chongchidinh', drug.contraindication);
    updateDetailSection('drug-tdkmm', drug.sideEffects);
    updateDetailSection('drug-cachdungngoaiiv', drug.dosageForm);
    updateDetailSection('drug-tuongtacccd', drug.drugInteractions);
    updateDetailSection('drug-ngodocqualieu', drug.overdose);
    updateDetailSection('drug-thongsotheodoi', drug.monitoring);
    updateDetailSection('drug-bhyt', drug.insurance);
    
    // Initialize accordion functionality after content is loaded
    setTimeout(() => {
        attachAccordionEvents();
        // Reset all accordion states before processing new ones
        resetAllAccordionStates();
    }, 50);
    
    // Auto scroll to "Cập nhật" section when new drug is selected
    setTimeout(() => {
        const capnhatSection = document.getElementById('section-capnhat');
        if (capnhatSection) {
            // Scroll to "Cập nhật" section, accounting for sticky navbar
            const elementTop = capnhatSection.getBoundingClientRect().top + window.pageYOffset;
            const offsetTop = elementTop - 80; // Offset to account for sticky header
            
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }, 100); // Small delay to ensure content is rendered
    
    // Show the details section
    detailsSection.style.display = 'block';
}

function updateDetailSection(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        // Use innerHTML instead of textContent to render HTML formatting
        element.innerHTML = content || 'Chưa có thông tin';
        
        // Process any special elements after content is loaded
        processContentElements(element);
    }
}

function processContentElements(container) {
    // Handle modal links (links with data-modal attribute)
    const modalLinks = container.querySelectorAll('a[data-modal]');
    modalLinks.forEach(link => {
        if (!link.hasAttribute('data-processed')) {
            link.setAttribute('data-processed', 'true');
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const title = this.getAttribute('data-modal-title') || this.textContent;
                const content = this.getAttribute('data-modal-content') || this.getAttribute('title') || 'Chưa có thông tin';
                showTextModal(title, content);
            });
        }
    });
    
    // Handle links with onclick="showModal(...)" pattern
    const onclickLinks = container.querySelectorAll('a[onclick*="showModal"]');
    onclickLinks.forEach(link => {
        if (!link.hasAttribute('data-processed')) {
            link.setAttribute('data-processed', 'true');
            const originalOnclick = link.getAttribute('onclick');
            link.removeAttribute('onclick');
            
            link.addEventListener('click', function(e) {
                e.preventDefault();
                // Extract title and content from onclick attribute
                const match = originalOnclick.match(/showModal\(['"`]([^'"`]*)['"`],\s*['"`]([^'"`]*)['"`]\)/);
                if (match) {
                    showTextModal(match[1], match[2]);
                } else {
                    showTextModal(this.textContent, 'Thông tin chi tiết');
                }
            });
        }
    });
    
    // Handle links with class "link-text" and data-message attribute
    const linkTextElements = container.querySelectorAll('a.link-text[data-message]');
    linkTextElements.forEach(link => {
        if (!link.hasAttribute('data-processed')) {
            link.setAttribute('data-processed', 'true');
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const message = this.getAttribute('data-message');
                const title = 'Tài liệu tham khảo'; // Default title for TLTK links
                showTextModal(title, message);
            });
        }
    });
}

function clearResults() {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
        resultsContainer.style.display = 'none'; // Hide the dropdown
    }
    // Don't clear currentResults here - keep them for drug detail lookup
}

function selectDrug(drugId, drugName) {
    // Fill the search input with selected drug name
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.value = drugName;
    }
    
    // Just hide the dropdown, don't clear results
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
    
    // Show the detailed drug information
    showDrugDetail(drugId);
    
    // Show TOC on mobile when drug is selected
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            if (typeof openMobileTOC === 'function') {
                openMobileTOC();
            }
        }, 500); // Small delay to let drug details load first
    }
}

function displayError(message, resultsContainerId = 'search-results') {
    const resultsContainer = document.getElementById(resultsContainerId);
    if (resultsContainer) {
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = `
            <div class="error-message">
                <span>⚠️ ${message}</span>
            </div>
        `;
    }
}

function showLoading(resultsContainerId = 'search-results') {
    const resultsContainer = document.getElementById(resultsContainerId);
    if (resultsContainer) {
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = `
            <div class="loading-message">
                <span>Đang tìm kiếm...</span>
            </div>
        `;
    }
}

function hideLoading(resultsContainerId = 'search-results') {
    // Loading will be replaced by results or error message, or hidden by clearResults()
}

// Initialize search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search');
    const toolSearchInput = document.getElementById('tool-search');
    
    // Setup drug search
    if (searchInput) {
        setupSearchInput(searchInput, 'search-results');
    }
    
    // Setup tool search with specific tool search functionality
    if (toolSearchInput) {
        setupToolSearchInput(toolSearchInput, 'tool-search-results');
    }
});

function setupToolSearchInput(inputElement, resultsContainerId) {
    inputElement.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        if (query.length >= 1) {
            searchTools(query, resultsContainerId);
        } else {
            clearSearchResults(resultsContainerId);
        }
    });
    
    // Clear results when input is cleared or escape is pressed
    inputElement.addEventListener('keyup', function(e) {
        if (e.key === 'Escape') {
            const resultsContainer = document.getElementById(resultsContainerId);
            if (resultsContainer) {
                resultsContainer.style.display = 'none';
            }
        } else if (e.target.value.trim() === '') {
            clearSearchResults(resultsContainerId);
        }
    });
    
    // Focus search input when switching to page
    inputElement.addEventListener('focus', function() {
        if (this.value.trim().length >= 1) {
            searchTools(this.value.trim(), resultsContainerId);
        }
    });
}

// Define available tools
const AVAILABLE_TOOLS = [
    {
        id: 'bmi-calculator',
        name: 'Tính chỉ số BMI',
        description: 'Body Mass Index - Chỉ số khối cơ thể',
        keywords: ['bmi', 'body mass index', 'chỉ số khối cơ thể', 'cân nặng', 'chiều cao'],
        action: 'initBMICalculator'
    },
    {
        id: 'dosage-calculator', 
        name: 'Tính liều thuốc',
        description: 'Tính toán liều thuốc theo cân nặng và tuổi',
        keywords: ['liều thuốc', 'dosage', 'tính liều', 'mg/kg', 'cân nặng'],
        action: 'initDosageCalculator'
    },
    {
        id: 'unit-converter',
        name: 'Đổi đơn vị y tế', 
        description: 'Chuyển đổi các đơn vị đo lường trong y tế',
        keywords: ['đổi đơn vị', 'unit converter', 'conversion', 'mg', 'ml', 'nhiệt độ'],
        action: 'initUnitConverter'
    },
    {
        id: 'egfr-tool',
        name: 'Tính mức lọc cầu thận (eGFR)',
        description: 'Công thức Schwartz cho trẻ em',
        keywords: ['egfr', 'lọc cầu thận', 'schwartz', 'creatinine', 'thận'],
        action: 'showEGFRTool'
    },
    {
        id: 'bsa-tool',
        name: 'Tính diện tích bề mặt da (BSA)',
        description: 'Công thức Mosteller',
        keywords: ['bsa', 'diện tích bề mặt da', 'mosteller', 'body surface area'],
        action: 'showBSATool'
    }
];

function searchTools(query, resultsContainerId) {
    const resultsContainer = document.getElementById(resultsContainerId);
    if (!resultsContainer) return;
    
    const lowerQuery = query.toLowerCase();
    
    // Filter tools based on name, description, and keywords
    const matchedTools = AVAILABLE_TOOLS.filter(tool => {
        return tool.name.toLowerCase().includes(lowerQuery) ||
               tool.description.toLowerCase().includes(lowerQuery) ||
               tool.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery));
    });
    
    if (matchedTools.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">Không tìm thấy công cụ nào.</div>';
        resultsContainer.style.display = 'block';
        return;
    }
    
    // Display results
    let resultsHTML = '';
    matchedTools.forEach(tool => {
        const highlightedName = highlightSearchTerm(tool.name, lowerQuery);
        const highlightedDesc = highlightSearchTerm(tool.description, lowerQuery);
        
        resultsHTML += `
            <div class="search-result-item" onclick="selectTool('${tool.id}', '${tool.action}')">
                <div>
                    <strong>${highlightedName}</strong>
                    <div style="font-size: 0.9em; color: #666;">${highlightedDesc}</div>
                </div>
            </div>
        `;
    });
    
    resultsContainer.innerHTML = resultsHTML;
    resultsContainer.style.display = 'block';
}

function selectTool(toolId, actionFunction) {
    // Hide search results
    const resultsContainer = document.getElementById('tool-search-results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
    
    // Clear search input
    const searchInput = document.getElementById('tool-search');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Show tools content container
    const toolsContent = document.querySelector('.tools-content');
    if (toolsContent) {
        toolsContent.style.display = 'block';
    }
    
    // Hide all tools first
    document.querySelectorAll('[id$="-tool"]').forEach(tool => {
        tool.style.display = 'none';
    });
    
    // Execute the appropriate action
    if (actionFunction === 'initBMICalculator' && window.initBMICalculator) {
        window.initBMICalculator();
    } else if (actionFunction === 'initDosageCalculator' && window.initDosageCalculator) {
        window.initDosageCalculator();
    } else if (actionFunction === 'initUnitConverter' && window.initUnitConverter) {
        window.initUnitConverter();
    } else if (actionFunction === 'showEGFRTool') {
        showBuiltInTool('egfr-tool');
    } else if (actionFunction === 'showBSATool') {
        showBuiltInTool('bsa-tool');
    }
}

function showBuiltInTool(toolId) {
    const tool = document.getElementById(toolId);
    if (tool) {
        tool.style.display = 'block';
    }
}

function highlightSearchTerm(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function setupSearchInput(inputElement, resultsContainerId) {
    inputElement.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        if (query.length >= 2) {
            searchDrugs(query, resultsContainerId);
        } else {
            clearSearchResults(resultsContainerId);
        }
    });
    
    // Clear results when input is cleared or escape is pressed
    inputElement.addEventListener('keyup', function(e) {
        if (e.key === 'Escape') {
            // Just hide dropdown on escape
            const resultsContainer = document.getElementById(resultsContainerId);
            if (resultsContainer) {
                resultsContainer.style.display = 'none';
            }
        } else if (e.target.value.trim() === '') {
            // Clear everything when input is empty
            clearSearchResults(resultsContainerId);
            currentResults = [];
        }
    });
    
    // Focus search input when switching to page
    inputElement.addEventListener('focus', function() {
        if (this.value.trim().length >= 2) {
            searchDrugs(this.value.trim(), resultsContainerId);
        }
    });
}

function clearSearchResults(resultsContainerId) {
    const resultsContainer = document.getElementById(resultsContainerId);
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
        resultsContainer.style.display = 'none';
    }
}

// Hide dropdown when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-section')) {
        const searchResults = document.getElementById('search-results');
        const toolSearchResults = document.getElementById('tool-search-results');
        
        if (searchResults) {
            searchResults.style.display = 'none';
        }
        if (toolSearchResults) {
            toolSearchResults.style.display = 'none';
        }
    }
});

function clearAllAccordionStates(container) {
    // Reset all accordion buttons to collapsed state
    const accordionButtons = container.querySelectorAll('.accordion-button');
    accordionButtons.forEach(button => {
        button.setAttribute('aria-expanded', 'false');
        button.classList.remove('active');
        
        // Reset associated content to properly collapsed state
        const content = button.nextElementSibling;
        if (content && content.classList.contains('accordion-content')) {
            content.style.display = 'none';
        }
    });
}

// Reset all accordion states to ensure consistent initial state
function resetAllAccordionStates() {
    const drugDetails = document.getElementById('drug-details');
    if (!drugDetails) return;
    
    const accordionButtons = drugDetails.querySelectorAll('.accordion-button');
    accordionButtons.forEach(button => {
        button.setAttribute('aria-expanded', 'false');
        button.classList.remove('active');
        
        const content = button.nextElementSibling;
        if (content && content.classList.contains('accordion-content')) {
            content.style.display = 'none';
        }
    });
}

// Attach accordion events - based on drugSearch-old.js
function attachAccordionEvents() {
    const accordionButtons = document.querySelectorAll('.accordion-button');

    accordionButtons.forEach(button => {
        // Remove any existing listeners to prevent duplicates
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', () => {
            const content = newButton.nextElementSibling;

            // Check current state and toggle
            const isExpanded = newButton.getAttribute('aria-expanded') === 'true';
            newButton.setAttribute('aria-expanded', !isExpanded);

            if (isExpanded) {
                newButton.classList.remove('active');
                content.style.display = 'none'; // Collapse content
            } else {
                newButton.classList.add('active');
                content.style.display = 'block'; // Expand content
            }
        });
    });
}

// Export functions for global use
window.searchDrugs = searchDrugs;
window.searchTools = searchTools;
window.selectTool = selectTool;
window.showDrugDetail = showDrugDetail;
window.selectDrug = selectDrug;
window.scrollToSection = function(sectionId) {
    const element = document.querySelector(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
};

// Initialize accordion functionality when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Drug search functionality loaded
});
