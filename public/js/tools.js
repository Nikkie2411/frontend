const tools = [
    { id: 'egfr-tool', name: 'Tính mức lọc cầu thận (eGFR)' },
    { id: 'bsa-tool', name: 'Tính diện tích bề mặt da (BSA)' },
  ];
  
  function showTool(toolId) {
    // Lấy phần tools-content
    const toolsContent = document.querySelector(".tools-content");
  
    // Ẩn tất cả công cụ con trước
    document.querySelectorAll(".tools-content > div").forEach(tool => {
      tool.style.display = "none";
    });
  
    // Hiển thị tools-content và công cụ được chọn
    toolsContent.style.display = "block";
    document.getElementById(toolId).style.display = "block";
  
    // Xóa nội dung ô tìm kiếm của trang Công cụ
    document.getElementById('tool-search').value = '';
  
    // Cuộn xuống tools-content nếu đang dùng điện thoại
    if (window.innerWidth < 768) {
      toolsContent.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  function calculateEGFR(event) {
    if (event) event.preventDefault(); // Ngăn chặn tải lại trang
    showSpinner();

    try {
    const dob = new Date(document.getElementById("dob").value);
    const gender = document.getElementById("gender").value;
    const premature = document.getElementById("premature").checked;
    const height = parseFloat(document.getElementById("height").value);
    const creatinine = parseFloat(document.getElementById("creatinine").value);

    if (isNaN(height) || isNaN(creatinine) || !dob) {
        document.getElementById("egfr-result").innerText = "Vui lòng nhập đầy đủ thông tin!";
        return;
    }
    if (height <= 0 || creatinine <= 0) {
      document.getElementById("egfr-result").innerText = "Chiều cao và creatinine phải lớn hơn 0!";
      return;
    }

    const today = new Date();
    const ageMonths = (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
    const ageYears = ageMonths / 12;

    let k;
    if (ageYears <= 1) {
        k = premature ? 29.2 : 39.8; // Trẻ sinh non hoặc đủ tháng ≤ 1 tuổi
    } else if (ageYears > 13) {
        k = gender === "male" ? 61.9 : 48.6; // Trẻ nam > 13 tuổi, trẻ nữ > 13 tuổi
    } else {
        k = 48.6; // Trẻ em 1 – 13 tuổi
    }
    
    const egfr = (k * height) / creatinine;
    document.getElementById("egfr-result").innerText = `${egfr.toFixed(2)} mL/min/1.73m²`;
  } catch (error) {
    document.getElementById("egfr-result").innerText = "Lỗi tính toán!";
  } finally {
    hideSpinner();
  }
}

function calculateBSA(event) {
    if (event) event.preventDefault(); // Ngăn chặn tải lại trang
    showSpinner();

    try {
    const height = parseFloat(document.getElementById("bsa-height").value);
    const weight = parseFloat(document.getElementById("bsa-weight").value);
    const resultElement = document.getElementById("bsa-result");

    if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
        resultElement.innerHTML = "Vui lòng nhập chiều cao và cân nặng hợp lệ!";
        resultElement.style.color = "red";
        return;
    }
    if (height <= 0 || weight <= 0) {
      document.getElementById("egfr-result").innerText = "Chiều cao và cân nặng phải lớn hơn 0!";
      return;
    }

    const bsa = Math.sqrt((height * weight) / 3600);
    document.getElementById("bsa-result").innerText = `${bsa.toFixed(2)} m²`;
  } catch (error) {
    document.getElementById("egfr-result").innerText = "Lỗi tính toán!";
  } finally {
    hideSpinner();
  }
}
  
// Khai báo biến toàn cục cho tool search
let toolSearchInput;
let toolSearchResults;

document.addEventListener("DOMContentLoaded", function() {
  // Gán giá trị cho các biến tìm kiếm công cụ
  toolSearchInput = document.getElementById("tool-search");
  toolSearchResults = document.getElementById("tool-search-results");
  const toolsContent = document.querySelector(".tools-content");

  if (toolsContent) {
    toolsContent.style.display = "none"; // Ẩn nội dung công cụ mặc định
  }

// Xử lý tìm kiếm công cụ
const debouncedToolSearch = debounce((query) => {
  if (!toolSearchResults || !toolSearchInput) return; // Kiểm tra để tránh lỗi undefined
  query = query.trim().toLowerCase();
  toolSearchResults.innerHTML = "";
  if (!query) {
    toolSearchResults.style.display = "none";
    return;
  }

  const filteredTools = tools.filter(tool => tool.name.toLowerCase().includes(query));
  if (filteredTools.length === 0) {
    toolSearchResults.innerHTML = '<p>Không tìm thấy công cụ nào.</p>';
    toolSearchResults.style.display = "block";
    return;
  }

  filteredTools.forEach(tool => {
    const toolDiv = document.createElement("div");
    toolDiv.className = "result-item";
    toolDiv.textContent = tool.name;
    toolDiv.onclick = () => {
      toolSearchResults.style.display = "none";
      toolSearchInput.value = tool.name;
      showTool(tool.id);
    };
    toolSearchResults.appendChild(toolDiv);
  });
  toolSearchResults.style.display = "block";
}, 300);

// Gắn sự kiện input cho tool search
if (toolSearchInput) {
    toolSearchInput.addEventListener("input", (e) => debouncedToolSearch(e.target.value));
  }

// Ẩn kết quả khi nhấp ra ngoài
document.addEventListener("click", (e) => {
    if (toolSearchInput && toolSearchResults &&
        !toolSearchInput.contains(e.target) && 
        !toolSearchResults.contains(e.target)) {
      toolSearchResults.style.display = "none";
    }
  });
});