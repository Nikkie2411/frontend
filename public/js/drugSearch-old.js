let drugs = [];
let searchTimeout;
const drugSearchCache = new Map();
const MAX_CACHE_SIZE = 100;

// Debounced search function
function debouncedSearch(query, delay = 300) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchDrug(query);
    }, delay);
}

async function searchDrug(query) {
    const searchInput = document.getElementById('search');
    const searchResultsDiv = document.getElementById('search-results');
    const spinner = document.getElementById('spinner');

    query = query.trim().toLowerCase();
    if (!query) {
      searchResultsDiv.style.display = 'none';
      searchResultsDiv.innerHTML = '';
      return;
    }

    // Check cache first with LRU eviction
    if (drugSearchCache.has(query)) {
        console.log(`✅ Cache hit for query: "${query}"`);
        const cachedData = drugSearchCache.get(query);
        // Move to end (most recently used)
        drugSearchCache.delete(query);
        drugSearchCache.set(query, cachedData);
        showSearchResults(cachedData, query);
        return;
    }

    try {
      // Show spinner while loading
      spinner.style.display = 'block';
      searchResultsDiv.innerHTML = '';

      // Use optimized fetch
      const result = await optimizedFetch(`${BACKEND_URL}/api/drugs?query=${encodeURIComponent(query)}&page=1&limit=10`, {
        method: 'GET'
      });

      if (!result.success) {
        throw new Error(result.error || 'Lỗi tìm kiếm');
      }

      const drugs = result.data?.data || result.data; 

      // Check results
      if (!drugs || drugs.length === 0) {
        searchResultsDiv.innerHTML = '<p>Không tìm thấy kết quả nào phù hợp.</p>';
        searchResultsDiv.style.display = 'block';
        return;
      }

    // Cache with LRU eviction
    if (drugSearchCache.size >= MAX_CACHE_SIZE) {
        const firstKey = drugSearchCache.keys().next().value;
        drugSearchCache.delete(firstKey);
    }
    drugSearchCache.set(query, drugs);
    console.log(`Cached result for query: "${query}"`);

    // Hiển thị kết quả
    showSearchResults(drugs, query, result.total > result.data.length ? result.page + 1 : null);

  } catch (error) {
    console.error('❌ Lỗi khi tìm kiếm thuốc:', error);
    
    let errorMessage = "Lỗi không xác định";
    if (!isOnline) {
      errorMessage = "Không có kết nối mạng";
    } else if (error.message.includes('timeout')) {
      errorMessage = "Kết nối quá chậm";
    } else {
      errorMessage = error.message || "Lỗi tìm kiếm";
    }
    
    searchResultsDiv.innerHTML = `<p style="color: red;">⚠️ ${errorMessage}. Vui lòng thử lại!</p>`;
    searchResultsDiv.style.display = 'block';
  } finally {
    spinner.style.display = 'none';
  }
}

// Cache cleanup every 10 minutes
setInterval(() => {
  drugSearchCache.clear();
  console.log('🧹 Drug search cache cleared');
}, 10 * 60 * 1000);

function showSearchResults(drugs, query, nextPage = null) {
    const searchResultsDiv = document.getElementById('search-results');
    const searchInput = document.getElementById('search');
  
    searchResultsDiv.innerHTML = ''; // Xóa kết quả cũ
    searchResultsDiv.style.display = 'block';
  
    // Hiển thị từng kết quả
    drugs.forEach(drug => {
      const drugDiv = document.createElement('div');
      drugDiv.className = 'result-item';
      drugDiv.textContent = drug['Hoạt chất']; // Hiển thị tên hoạt chất
      drugDiv.onclick = () => {
        searchResultsDiv.style.display = 'none';
        searchInput.value = drug['Hoạt chất']; // Điền lại ô tìm kiếm
        showDrugDetails(drug); // Hiển thị chi tiết thuốc
      };
      searchResultsDiv.appendChild(drugDiv);
    });
  
    // Nếu có thêm kết quả (pagination), thêm nút "Xem thêm"
    if (nextPage) {
      const moreButton = document.createElement('button');
      moreButton.className = 'result-item';
      moreButton.textContent = 'Xem thêm';
      moreButton.style.cursor = 'pointer';
      moreButton.style.fontStyle = 'italic';
      moreButton.onclick = () => searchDrug(query, nextPage);
      searchResultsDiv.appendChild(moreButton);
    }
}

// Event listeners with optimized debounced search
document.getElementById('search').addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
});

// Hide results when clicking outside
document.addEventListener('click', (e) => {
    const searchResults = document.getElementById('search-results');
    const searchInput = document.getElementById('search');
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.style.display = 'none';
    }
});

  function showDrugDetails(drug) {
    const sections = [
      {id: 'drug-name', key: 'Hoạt chất', defaultText: 'Không rõ'},
      {id: 'drug-phanloaiduocly', key: 'Phân loại dược lý'},
      {id: 'drug-lieutresosinh', key: 'Liều thông thường trẻ sơ sinh'},
      {id: 'drug-lieutreem', key: 'Liều thông thường trẻ em'},
      {id: 'drug-hieuchinhCNthan', key: 'Hiệu chỉnh liều theo chức năng thận'},
      {id: 'drug-hieuchinhCNgan', key: 'Hiệu chỉnh liều theo chức năng gan'},
      {id: 'drug-chongchidinh', key: 'Chống chỉ định'},
      {id: 'drug-tdkmm', key: 'Tác dụng không mong muốn'},
      {id: 'drug-cachdungngoaiiv', key: 'Cách dùng (ngoài IV)'},
      {id: 'drug-tuongtacccd', key: 'Tương tác thuốc chống chỉ định'},
      {id: 'drug-ngodocqualieu', key: 'Ngộ độc/Quá liều'},
      {id: 'drug-thongsotheodoi', key: 'Các thông số cần theo dõi'},
      {id: 'drug-bhyt', key: 'Bảo hiểm y tế thanh toán'},
      {id: 'drug-capnhat', key: 'Cập nhật'},
    ]
    
    sections.forEach(({ id, key, defaultText = 'Không có thông tin' }) => {
      const content = drug[key] || defaultText; // Lấy dữ liệu HTML trực tiếp từ backend
      const element = document.getElementById(id);
      element.innerHTML = content; // Hiển thị HTML mà không cần sanitize
      element.parentElement.style.display = content === defaultText ? 'none' : 'block';
    });

    const detailsSection = document.getElementById('drug-details');
    detailsSection.style.display = 'block';

    // Xóa ô tìm kiếm để người dùng dễ bắt đầu lại
    document.getElementById('search').value = '';

    // Cuộn mượt đến phần thông tin chi tiết
    detailsSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    // Tự động hiện cột mục lục và overlay trên mobile
  if (window.innerWidth <= 768) {
    const tocContainer = document.querySelector('#drug-info .toc-container');
    const overlay = document.getElementById('toc-overlay');
    if (tocContainer && overlay) {
      tocContainer.classList.add('active');
      overlay.style.display = 'block'; // Hiển thị overlay khi thanh mục lục tự động bật
    }
  }

    attachAccordionEvents();
    attachLinkEvents();
  }

  // Loại bỏ hàm scrollToSection cũ - đã được thay thế bằng global function

  function attachLinkEvents() {
    // Lấy tất cả các liên kết có lớp 'link-text'
    const linkElements = document.querySelectorAll('.link-text');

    linkElements.forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault(); // Ngăn chặn hành động mặc định của liên kết

        // Lấy nội dung từ thuộc tính data-message
        const message = link.getAttribute('data-message');

        if (message) {
        // Hiển thị nội dung trong modal
        document.getElementById('modalContent').innerText = message;

        // Hiển thị modal Bootstrap với fallback
        const modalElement = document.getElementById('textModal');
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        } else if (typeof $ !== 'undefined' && $.fn.modal) {
          $('#textModal').modal('show');
        } else {
          // Fallback thủ công
          modalElement.classList.add('show');
          modalElement.style.display = 'block';
          modalElement.setAttribute('aria-modal', 'true');
          modalElement.setAttribute('role', 'dialog');
          
          // Thêm backdrop
          const backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          backdrop.id = 'text-modal-backdrop';
          document.body.appendChild(backdrop);
          document.body.classList.add('modal-open');
          
          // Xử lý đóng modal
          const closeModal = () => {
            modalElement.classList.remove('show');
            modalElement.style.display = 'none';
            modalElement.removeAttribute('aria-modal');
            modalElement.removeAttribute('role');
            const existingBackdrop = document.getElementById('text-modal-backdrop');
            if (existingBackdrop) {
              existingBackdrop.remove();
            }
            document.body.classList.remove('modal-open');
          };
          
          // Gắn sự kiện đóng modal
          modalElement.querySelectorAll('.btn-close, [data-bs-dismiss="modal"]').forEach(btn => {
            btn.onclick = closeModal;
          });
          
          // Đóng modal khi click vào backdrop
          backdrop.onclick = closeModal;
        }
        }
      });
    });
  }

function attachAccordionEvents() {
    const accordionButtons = document.querySelectorAll('.accordion-button');

    accordionButtons.forEach(button => {
      button.addEventListener('click', () => {
        const content = button.nextElementSibling;

        // Kiểm tra trạng thái hiển thị và chuyển đổi
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', !isExpanded);

        if (isExpanded) {
          content.style.display = 'none'; // Thu gọn nội dung
        } else {
            content.style.display = 'block'; // Mở nội dung
          }
      });
    });
  }

// Expose scrollToSection to global scope
window.scrollToSection = function(sectionId) {
  const target = document.querySelector(sectionId);
  if (target) {
    console.log('Scrolling to section:', sectionId);
    console.log('Target element:', target);
    
    const detailsContent = document.querySelector('.details-content');
    console.log('Details content:', detailsContent);
    
    if (detailsContent) {
      // Phương pháp đơn giản: sử dụng scrollIntoView với container tùy chỉnh
      const stickyHeader = document.querySelector('#drug-name');
      const headerHeight = stickyHeader ? stickyHeader.offsetHeight : 0;
      
      // Cuộn target vào view trước
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      
      // Sau đó điều chỉnh vị trí để tránh sticky header
      setTimeout(() => {
        const currentScrollTop = detailsContent.scrollTop;
        const adjustedPosition = currentScrollTop - headerHeight - 20;
        
        console.log('Current scroll:', currentScrollTop);
        console.log('Header height:', headerHeight);
        console.log('Adjusted position:', adjustedPosition);
        
        detailsContent.scrollTo({
          top: Math.max(0, adjustedPosition),
          behavior: 'smooth'
        });
      }, 100);
      
    } else {
      // Fallback cho trường hợp không có details-content
      console.log('Using fallback scroll for:', sectionId);
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
    
    // Loại bỏ lớp highlight khỏi tất cả các mục
    const allSections = document.querySelectorAll('.details-item');
    allSections.forEach(section => section.classList.remove('highlight'));

    // Thêm lớp highlight cho mục được chọn
    target.classList.add('highlight');

    // Đóng thanh mục lục và overlay trên mobile
    if (window.innerWidth <= 768) {
      const tocContainer = document.querySelector('#drug-info .toc-container');
      const overlay = document.getElementById("toc-overlay");
      if (tocContainer) {
        tocContainer.classList.remove('active');
      }
      if (overlay) {
        overlay.style.display = 'none';
      }
    }
  } else {
    console.error('Section not found:', sectionId);
  }
};
