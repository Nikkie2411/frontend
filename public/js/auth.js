const Auth = {
    isLoggedIn: () => sessionStorage.getItem('isLoggedIn') === 'true',
    getUser: () => sessionStorage.getItem('loggedInUser'),
    getDeviceId: async () => {
      // Device ID được tạo từ hardware fingerprint, không lưu storage
      const { deviceId } = await getDeviceId();
      return deviceId;
    },
    login: (username) => {
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('loggedInUser', username);
      // Không lưu deviceId vào storage nữa vì nó sẽ được tạo từ hardware
    },
    logout: () => {
      sessionStorage.clear();
      localStorage.clear(); // Clear both for safety
    }
};

  // Utility function to switch between login and main app
  function showScreen(screen) {
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    const spinner = document.getElementById('spinner');
    
    // Hide spinner
    if (spinner) spinner.style.display = 'none';
    
    if (screen === 'login') {
      document.body.classList.add('login-active');
      if (mainApp) mainApp.style.display = 'none';
      if (loginScreen) loginScreen.style.display = 'block';
      console.log('🔐 Showing login screen');
    } else if (screen === 'main') {
      document.body.classList.remove('login-active');
      if (loginScreen) loginScreen.style.display = 'none';
      if (mainApp) mainApp.style.display = 'block';
      console.log('🏠 Showing main app');
    }
  }

  // Initialize
  window.onload = async function() {
    console.log('🚀 Initializing auth system...');
    
    // Clear any previous tab close flag (this means page was refreshed/reloaded)
    if (sessionStorage.getItem('possibleTabClose') === 'true') {
      sessionStorage.removeItem('possibleTabClose');
      console.log('🔄 Page reloaded - clearing tab close flag');
    }
    
    // Initially hide both screens to prevent flashing
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    if (loginScreen) loginScreen.style.display = 'none';
    if (mainApp) mainApp.style.display = 'none';
    
    if (Auth.isLoggedIn()) {
      console.log('📋 User is logged in, checking session...');
      // Kiểm tra session tự động
      const valid = await checkSession();
      if (!valid) {
        console.log('❌ Session invalid, showing login');
        // Nếu session không hợp lệ, hiển thị trang login
        showScreen('login');
        return;
      }
      console.log('✅ Session valid, showing main app');
      // Session hợp lệ, hiển thị app chính
      showScreen('main');
      const username = Auth.getUser();
      const deviceId = await Auth.getDeviceId();
      connectWebSocket(username, deviceId);
      
      // Initialize chatbot after successful login
      if (typeof initializeChatbot === 'function') {
        initializeChatbot();
      }
      
      // Start new device validation system
      startDeviceValidation();
    } else {
      console.log('🔒 User not logged in, showing login screen');
      // Chưa đăng nhập, hiển thị trang login
      showScreen('login');
    }
    
    // Track if this is a refresh vs actual tab close
    let isRefreshing = false;
    
    // Detect refresh (F5, Ctrl+R, etc.)
    window.addEventListener('keydown', function(e) {
      if ((e.key === 'F5') || (e.ctrlKey && e.key === 'r') || (e.ctrlKey && e.key === 'R')) {
        isRefreshing = true;
        console.log('� Page refresh detected, preserving session...');
      }
    });
    
    // Detect when user navigates away (but not refresh)
    window.addEventListener('beforeunload', function(e) {
      // Only mark as refreshing if it's actually a refresh
      if (!isRefreshing) {
        // This might be a tab close, mark it
        sessionStorage.setItem('possibleTabClose', 'true');
        console.log('❓ Possible tab close detected...');
      } else {
        console.log('🔄 Refresh detected, keeping session...');
        isRefreshing = false; // Reset flag
      }
    });
  };

  // Additional cleanup when window is about to close (but not refresh)
  window.addEventListener('pagehide', async function(e) {
    // Check if this was marked as a possible tab close (not refresh)
    const possibleClose = sessionStorage.getItem('possibleTabClose');
    
    if (Auth.isLoggedIn() && possibleClose === 'true') {
      const username = Auth.getUser();
      const deviceId = await Auth.getDeviceId();
      
      console.log('� Tab actually closing, performing logout...');
      
      try {
        // Use sendBeacon for more reliable delivery
        const data = JSON.stringify({ username, deviceId });
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(`${BACKEND_URL}/api/logout-device-from-sheet`, blob);
        console.log('✅ Final logout beacon sent');
      } catch (error) {
        console.error('❌ Error during pagehide logout:', error);
      }
      
      // Final cleanup only if actually closing
      sessionStorage.clear();
      localStorage.clear();
    } else if (possibleClose === 'true') {
      // Clear the flag but don't logout (user might not be logged in)
      sessionStorage.removeItem('possibleTabClose');
      console.log('🔄 False alarm - this was just a page navigation');
    }
  });

  // Simplified and more effective device validation system
  let deviceValidationInterval;
  let isValidationActive = false;
  
  function startDeviceValidation() {
    // Stop any existing validation
    stopDeviceValidation();
    
    isValidationActive = true;
    console.log("🔄 Starting device validation system...");
    
    // Immediate validation check
    performDeviceValidation();
    
    // Set up periodic validation every 3 minutes (more frequent for better security)
    deviceValidationInterval = setInterval(() => {
      if (isValidationActive && Auth.isLoggedIn()) {
        performDeviceValidation();
      }
    }, 3 * 60 * 1000); // 3 minutes
  }
  
  function stopDeviceValidation() {
    if (deviceValidationInterval) {
      clearInterval(deviceValidationInterval);
      deviceValidationInterval = null;
    }
    isValidationActive = false;
    console.log("🛑 Device validation stopped");
  }
  
  async function performDeviceValidation() {
    if (!Auth.isLoggedIn()) {
      stopDeviceValidation();
      return;
    }
    
    const username = Auth.getUser();
    const deviceId = await Auth.getDeviceId();
    
    if (!username || !deviceId) {
      console.warn("⚠️ Missing credentials for validation");
      return;
    }
    
    console.log("� Performing device validation check...");
    
    try {
      // Direct API call without cache to ensure real-time validation
      const response = await fetch(`${BACKEND_URL}/api/check-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, deviceId }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        console.log("🚨 Device validation failed:", data.message);
        
        // Force logout immediately if device is not valid
        if (data.message.includes("đã bị đăng xuất") || 
            data.message.includes("bị hủy duyệt") ||
            data.message.includes("không tồn tại")) {
          
          alert(`⚠️ CẢNH BÁO BẢO MẬT: ${data.message}\nBạn sẽ được đăng xuất ngay lập tức!`);
          await forceLogout();
        }
      } else {
        console.log("✅ Device validation passed");
      }
    } catch (error) {
      console.error("🚨 Device validation error:", error);
      // Don't logout on network errors - could be temporary connection issues
    }
  }
  
  async function forceLogout() {
    stopDeviceValidation();
    
    // Hide chatbot widget
    if (typeof hideChatWidget === 'function') {
      hideChatWidget();
    }
    
    // Close WebSocket
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
      window.ws.close();
    }
    
    // Clear all storage
    sessionStorage.clear();
    localStorage.clear();
    
    // Immediate redirect
    window.location.href = window.location.origin;
  }

  // Simplified session check - no cache for real-time validation
  async function checkSession() {
    const loggedInUser = sessionStorage.getItem("loggedInUser");
    const { deviceId } = await getDeviceId();

    if (!loggedInUser || !deviceId) return false;

    try {
        // Direct API call without cache for immediate response
        const response = await fetch(`${BACKEND_URL}/api/check-session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: loggedInUser, deviceId }),
        });

        const data = await response.json();

        if (!data.success) {
            console.warn("⚠️ Session invalid:", data.message);
            
            // Handle device selection scenarios
            if (data.devices) {
                showDeviceLogoutOptions(data.devices, loggedInUser, deviceId, "Thiết bị hiện tại");
                return false;
            }
            
            // Force logout for security violations
            if (data.message.includes("đã bị đăng xuất") || 
                data.message.includes("bị hủy duyệt") ||
                data.message.includes("không tồn tại")) {
                
                console.log("🚨 Security violation detected - forcing logout");
                await forceLogout();
                return false;
            }
            
            // Clear storage for other session issues
            localStorage.clear();
            return false;
        }

        return true;
    } catch (error) {
        console.error("🚨 Session check error:", error);
        // Return true for offline scenarios to avoid unnecessary logouts
        return !navigator.onLine;
    }
  }

  // Handle Login
  async function handleLogin() {
    if (Auth.isLoggedIn()) return;
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const { deviceId, deviceName } = await getDeviceId(); // Lấy cả deviceId và deviceName
    const errorDisplay = document.getElementById("login-error");
    const maxRetries = 3;

    if (!username || !password || !deviceId) {
      errorDisplay.textContent = "Vui lòng nhập đầy đủ thông tin!";
      errorDisplay.style.display = "block";
      return;
    }
    if (!deviceId) {
      errorDisplay.textContent = "Không thể lấy thông tin thiết bị. Vui lòng thử lại!";
      errorDisplay.style.display = "block";
      return;
    }

    const isProduction = window.location.hostname !== 'localhost';
    if (!isProduction) {

    }
    showSpinner();
    errorDisplay.textContent = "Đang kết nối, vui lòng đợi...";
    errorDisplay.style.color = "#00b383"; // Màu xanh để thân thiện hơn
    errorDisplay.style.display = "block";

    try {

      showSpinner();
      errorDisplay.textContent = "Đang kết nối...";
      errorDisplay.style.color = "#00b383";
      errorDisplay.style.display = "block";

      const result = await optimizedFetch(`${BACKEND_URL}/api/login`, {
        method: "POST",
        body: JSON.stringify({ username, password, deviceId, deviceName }),
        credentials: 'include'
      });

      if (result.success && result.data.success) {
          Auth.login(username);
          showScreen('main');
          connectWebSocket(username, deviceId);
          
          // Initialize chatbot after successful login
          if (typeof initializeChatbot === 'function') {
            initializeChatbot();
          }
          
          // Start new device validation system
          startDeviceValidation();
      } else {
        errorDisplay.style.color = "red";
        
        // Handle different types of errors
        if (!result.success) {
          // HTTP error or network error
          let message = "Đăng nhập thất bại!";
          if (result.status === 401) {
            message = "Sai tên đăng nhập hoặc mật khẩu!";
          } else if (result.status === 403) {
            message = result.error || "Tài khoản chưa được phê duyệt bởi quản trị viên.";
          } else if (result.status === 409) {
            // Device selection required
            const data = result.data;
            if (data && data.code === 'DEVICE_SELECTION_REQUIRED' && data.devices) {
              hideSpinner(); // Hide spinner before showing modal
              showDeviceLogoutOptions(data.devices, username, deviceId, deviceName);
              return; // Don't show error message
            } else {
              message = data.message || "Đã đạt giới hạn thiết bị!";
            }
          } else if (result.status === 429) {
            message = "Quá nhiều lần thử. Vui lòng đợi một lúc!";
          } else if (result.error) {
            message = result.error;
          }
          errorDisplay.textContent = message;
          errorDisplay.style.display = "block";
        } else {
          // Response success but data indicates failure
          const data = result.data;
          if (data.devices) {
            showDeviceLogoutOptions(data.devices, username, deviceId, deviceName);
          } else {
            const message = data.message || "Đăng nhập thất bại!";
            errorDisplay.textContent = message;
            errorDisplay.style.display = "block";
          }
        }
      }   
    } catch (error) {
      errorDisplay.style.color = "red";
      
      let errorMessage = "Đã xảy ra lỗi kết nối!";
      
      if (!isOnline) {
        errorMessage = "Không có kết nối mạng. Vui lòng kiểm tra kết nối!";
      } else if (error.message && error.message.includes('timeout')) {
        errorMessage = "Kết nối quá chậm. Vui lòng thử lại!";
      }
      
      errorDisplay.textContent = errorMessage;
      errorDisplay.style.display = "block";
    } finally {
      hideSpinner();
    }
}

let isLoginInProgress = false;
// Tạo phiên bản debounce của handleLogin
const debouncedHandleLogin = debounce(async () => {
  if (isLoginInProgress) {

    return;
  }
  isLoginInProgress = true;
  const loginButton = document.querySelector('.btn-primary');
  loginButton.disabled = true;
  try {
    await handleLogin();
  } finally {
    loginButton.disabled = false;
    isLoginInProgress = false;
  }
}, 500);

document.getElementById("password").addEventListener("keypress", (e) => {
if (e.key === "Enter") {

  if (!isLoginInProgress) {
    debouncedHandleLogin();
  } else {

  }
}
});

  //Đăng ký user
  async function registerUser() {
    const username = document.getElementById("reg-username").value;
    const password = document.getElementById("reg-password").value;
    const confirmPassword = document.getElementById("reg-confirm-password").value.trim();
    const fullname = document.getElementById("reg-fullname").value;
    const email = document.getElementById("reg-email").value;
    const phone = document.getElementById("reg-phone").value;
    const occupation = document.getElementById("reg-occupation").value;
    const workplace = document.getElementById("reg-workplace").value;
    const province = document.getElementById("reg-province").value;

    if (!username || !password ||!confirmPassword || !fullname || !email || !phone|| !occupation || !workplace || !province) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (username.length < 6 || /\s/.test(username)) {
      alert("Tên đăng nhập phải ít nhất 6 ký tự và không chứa dấu cách!");
      return;
    }

    if (password !== confirmPassword) {
      alert("Mật khẩu không khớp!");
      return;
    }

    if (password.length < 6 || !/[!@#$%^&*]/.test(password)) {
      alert("Mật khẩu phải dài ít nhất 6 ký tự và chứa ít nhất 1 ký tự đặc biệt!");
      return;
    }

    const userData = { username, password, fullname, email, phone, occupation, workplace, province };

    try {
      const response = await fetch(`${BACKEND_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (data.success) {
        alert("Đăng ký thành công! Thông báo phê duyệt tài khoản thành công sẽ được gửi tới email của bạn.");
        document.getElementById("registerModal").querySelector(".btn-close").click();
      } else {
        alert("Lỗi đăng ký: " + data.message);
      }
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại sau!");
    }
  }

  function showRegisterModal() {

    
    // Kiểm tra xem Bootstrap đã sẵn sàng chưa
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {

      const modal = new bootstrap.Modal(document.getElementById('registerModal'));
      modal.show();
    } else {

      // Fallback: sử dụng jQuery nếu có hoặc hiển thị modal trực tiếp
      const modalElement = document.getElementById('registerModal');
      if (modalElement) {
        // Sử dụng jQuery Bootstrap modal nếu có
        if (typeof $ !== 'undefined' && $.fn.modal) {

          $('#registerModal').modal('show');
        } else {

          // Hiển thị modal bằng cách thêm class Bootstrap
          modalElement.classList.add('show');
          modalElement.style.display = 'block';
          modalElement.setAttribute('aria-modal', 'true');
          modalElement.setAttribute('role', 'dialog');
          
          // Thêm backdrop
          const backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          backdrop.id = 'modal-backdrop';
          document.body.appendChild(backdrop);
          document.body.classList.add('modal-open');
          
          // Xử lý đóng modal
          const closeModal = () => {
            modalElement.classList.remove('show');
            modalElement.style.display = 'none';
            modalElement.removeAttribute('aria-modal');
            modalElement.removeAttribute('role');
            const existingBackdrop = document.getElementById('modal-backdrop');
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
      } else {
        console.error('registerModal element not found');
      }
    }
  }

  //Chọn tỉnh
  async function loadProvinces() {
  try {
    const response = await fetch('https://provinces.open-api.vn/api/p/');
    if (!response.ok) throw new Error('Không thể tải danh sách tỉnh');
    const provinces = await response.json();
    const select = document.getElementById('reg-province');
    select.innerHTML = '<option value="">Chọn tỉnh/thành phố</option>';
    provinces.forEach(p => {
      const option = document.createElement('option');
      option.value = p.name;
      option.textContent = p.name;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Lỗi tải danh sách tỉnh:', error);
    select.innerHTML = '<option value="">Lỗi tải tỉnh - <a href="#" onclick="loadProvinces()">Thử lại</a></option>';
  }
}
document.addEventListener('DOMContentLoaded', loadProvinces);

function showForgotPasswordModal() {

    
    // Kiểm tra xem Bootstrap đã sẵn sàng chưa
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {

      const modal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
      modal.show();
    } else {

      // Fallback: sử dụng jQuery nếu có hoặc hiển thị modal trực tiếp
      const modalElement = document.getElementById('forgotPasswordModal');
      if (modalElement) {
        // Sử dụng jQuery Bootstrap modal nếu có
        if (typeof $ !== 'undefined' && $.fn.modal) {

          $('#forgotPasswordModal').modal('show');
        } else {

          // Hiển thị modal bằng cách thêm class Bootstrap
          modalElement.classList.add('show');
          modalElement.style.display = 'block';
          modalElement.setAttribute('aria-modal', 'true');
          modalElement.setAttribute('role', 'dialog');
          
          // Thêm backdrop
          const backdrop = document.createElement('div');
          backdrop.className = 'modal-backdrop fade show';
          backdrop.id = 'forgot-modal-backdrop';
          document.body.appendChild(backdrop);
          document.body.classList.add('modal-open');
          
          // Xử lý đóng modal
          const closeModal = () => {
            modalElement.classList.remove('show');
            modalElement.style.display = 'none';
            modalElement.removeAttribute('aria-modal');
            modalElement.removeAttribute('role');
            const existingBackdrop = document.getElementById('forgot-modal-backdrop');
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
      } else {
        console.error('forgotPasswordModal element not found');
      }
    }
  }

async function requestOTP() {
    const username = document.getElementById("forgot-username").value.trim();
    if (!username) return alert("Vui lòng nhập tên đăng nhập!");

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${BACKEND_URL}/api/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      const text = await response.text();

      const data = JSON.parse(text);
      alert(data.message);

      if (data.success) {
        document.getElementById("otp-section").style.display = "block";
        return;
      }
      break;
    } catch (error) {
      attempt++;
      console.error("🚨 Lỗi khi gửi OTP:", error);
      if (attempt === maxRetries) {
        alert("Lỗi kết nối máy chủ sau nhiều lần thử!");
        return;
    }
    await new Promise(resolve => setTimeout(resolve, 2000)); // Đợi 2s trước khi thử lại
    }
  }
}

async function verifyOTP() {
    const username = document.getElementById("forgot-username").value.trim();
    const otp = document.getElementById("otp-input").value.trim();
    const resetPasswordSection = document.getElementById("reset-password-form");

    if (!username || !otp) {
        alert("Vui lòng nhập đầy đủ thông tin!");
        return;
    }

    try {


        const response = await fetch(`${BACKEND_URL}/api/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, otp }),
        });

        const text = await response.text();


        const data = JSON.parse(text);
        alert(data.message);

        if (data.success) {

            if (resetPasswordSection) {
                resetPasswordSection.style.display = "block"; // Chỉ hiển thị nếu phần tử tồn tại
            } else {
                console.error("❌ Lỗi: Không tìm thấy phần tử #reset-password-form");
            }
        }
    } catch (error) {
        console.error("❌ Lỗi khi xác minh OTP:", error);
    }
  }

  async function resetPassword() {
    const username = document.getElementById("forgot-username").value.trim();
    const newPassword = document.getElementById("new-password").value.trim();
    const confirmPassword = document.getElementById("confirm-password").value.trim();

    if (!username || !newPassword || !confirmPassword) {
        alert("Vui lòng nhập đầy đủ thông tin!");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("Mật khẩu xác nhận không khớp!");
        return;
    }

    if (newPassword.length < 6) {
      alert("Mật khẩu mới phải dài ít nhất 6 ký tự!");
      return;
    }

    try {


        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(`${BACKEND_URL}/api/reset-password`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${username}`
          },
          body: JSON.stringify({ username, newPassword }),
          signal: controller.signal
        });
        clearTimeout(timeout);

        const text = await response.text();


        const data = JSON.parse(text);
        alert(data.message);

        if (data.success) {
          // Xóa thông tin đăng nhập trên trình duyệt
          sessionStorage.removeItem("isLoggedIn");
          sessionStorage.removeItem("loggedInUser");
          localStorage.clear(); // Clear any remaining localStorage data

          // Reset form
          document.getElementById("new-password").value = "";
          document.getElementById("confirm-password").value = "";
          document.getElementById("forgot-username").value = "";
          document.getElementById("otp-input").value = "";
          
          // Ẩn các phần của modal
          document.getElementById("otp-section").style.display = "none";
          document.getElementById("reset-password-form").style.display = "none";
          
          // Đóng modal với try-catch để tránh lỗi làm dừng process
          try {
            const modalElement = document.getElementById('forgotPasswordModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
              modal.hide();
            } else {
              // Fallback nếu Bootstrap chưa khởi tạo modal
              modalElement.style.display = 'none';
              document.body.classList.remove('modal-open');
              const backdrop = document.querySelector('.modal-backdrop');
              if (backdrop) {
                backdrop.remove();
              }
            }
          } catch (modalError) {
            console.warn("Error closing modal:", modalError);
            // Force close modal manually
            const modalElement = document.getElementById('forgotPasswordModal');
            if (modalElement) {
              modalElement.style.display = 'none';
              modalElement.classList.remove('show');
              document.body.classList.remove('modal-open');
              const backdrop = document.querySelector('.modal-backdrop');
              if (backdrop) {
                backdrop.remove();
              }
            }
          }

          // Chuyển về trang đăng nhập sau một chút để người dùng đọc thông báo
          setTimeout(() => {
            window.location.href = "index.html";
          }, 2000);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
          alert('Yêu cầu quá thời gian, vui lòng thử lại!');
        } else {
          alert(error.message || 'Có lỗi xảy ra, vui lòng thử lại!');
        }
    }
}

function showDeviceLogoutOptions(devices, username, deviceId, deviceName) {
    const deviceList = document.getElementById('device-list');
    deviceList.innerHTML = '';
    
    devices.forEach((device, index) => {
        const deviceCard = document.createElement('div');
        deviceCard.className = 'card mb-2';
        deviceCard.innerHTML = `
            <div class="card-body">
                <h6 class="card-title">${device.name || 'Thiết bị không tên'}</h6>
                <p class="card-text text-muted">ID: ${device.id.slice(0, 8)}...</p>
                <button class="btn btn-danger btn-sm" onclick="replaceDeviceAndLogin('${username}', '${device.id}', '${deviceId}', '${deviceName}')">
                    Đăng xuất thiết bị này và đăng nhập
                </button>
            </div>
        `;
        deviceList.appendChild(deviceCard);
    });
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('deviceSelectionModal'));
    modal.show();
}

document.getElementById("password").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {

      if (!isLoginInProgress) {
        debouncedHandleLogin();
      } else {

      }
    }
  });

document.addEventListener("DOMContentLoaded", function() {
    const usernameInput = document.getElementById("reg-username");
    const usernameError = document.getElementById("username-error");
    const usernameSuccess = document.getElementById("username-success");

    const passwordInput = document.getElementById("reg-password");
    const confirmPasswordInput = document.getElementById("reg-confirm-password");
    const passwordError = document.getElementById("password-error");
    const passwordSuccess = document.getElementById("password-success");

    const emailInput = document.getElementById("reg-email");
    const emailError = document.getElementById("email-error");
    const emailSuccess = document.getElementById("email-success");

    const phoneInput = document.getElementById("reg-phone");
    const phoneError = document.createElement("span");
    phoneError.id = "phone-error";
    phoneError.style.color = "red";
    phoneError.style.display = "none";
    phoneError.textContent = "❌ Số điện thoại không hợp lệ!";
    phoneInput.insertAdjacentElement("afterend", phoneError);

    const phoneSuccess = document.createElement("span");
    phoneSuccess.id = "phone-success";
    phoneSuccess.style.color = "green";
    phoneSuccess.style.display = "none";
    phoneSuccess.textContent = "✅ Số điện thoại hợp lệ!";
    phoneError.insertAdjacentElement("afterend", phoneSuccess);

    const registerButton = document.getElementById("register-btn");

    let usernameCache = {};
    let isUsernameValid = false;
    let isPasswordValid = false;
    let isEmailValid = false;
    let isPhoneValid = false;

    async function checkUsernameExists(username) {
      if (usernameCache[username] !== undefined) return usernameCache[username];

      try {
        const response = await fetch("https://pedmedvn.onrender.com/api/check-username", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        usernameCache[username] = data.exists; // Lưu vào cache
        return data.exists;
      } catch (error) {
        console.error("❌ Lỗi khi kiểm tra username:", error);
        return true; // Giả định username tồn tại nếu có lỗi
      }
    }

    async function validateUsernameInput() {
        const usernameValue = usernameInput.value.trim();
        usernameError.style.display = "none";
        usernameSuccess.style.display = "none";

        if (!usernameValue) {
      isUsernameValid = false;
    } else if (usernameValue.length < 6 || /\s/.test(usernameValue)) {
      usernameError.textContent = "❌ Tên đăng nhập phải ít nhất 6 ký tự và không chứa dấu cách!";
      usernameError.style.display = "inline";
      isUsernameValid = false;
    } else {
      const usernameExists = await checkUsernameExists(usernameValue);
      if (usernameExists) {
        usernameError.textContent = "❌ Tên đăng nhập đã tồn tại!";
        usernameError.style.display = "inline";
        isUsernameValid = false;
      } else {
        usernameSuccess.style.display = "inline";
        isUsernameValid = true;
      }
    }
    updateRegisterButton();
  }

  // Kiểm tra mật khẩu
  function validatePasswordInput() {
    const passwordValue = passwordInput.value.trim();
    const confirmPasswordValue = confirmPasswordInput.value.trim();
    passwordError.style.display = "none";
    passwordSuccess.style.display = "none";

    if (!passwordValue || !confirmPasswordValue) {
      isPasswordValid = false;
    } else if (passwordValue !== confirmPasswordValue) {
      passwordError.style.display = "inline";
      isPasswordValid = false;
    } else if (passwordValue.length < 6 || !/[!@#$%^&*]/.test(passwordValue)) {
      passwordError.textContent = "❌ Mật khẩu phải ít nhất 6 ký tự và chứa ít nhất 1 ký tự đặc biệt!";
      passwordError.style.display = "inline";
      isPasswordValid = false;
    } else {
      passwordSuccess.style.display = "inline";
      isPasswordValid = true;
    }
    updateRegisterButton();
  }

// Kiểm tra email
function validateEmailInput() {
    const emailValue = emailInput.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    emailError.style.display = "none";
    emailSuccess.style.display = "none";

    if (!emailValue) {
      isEmailValid = false;
    } else if (!emailPattern.test(emailValue)) {
      emailError.style.display = "inline";
      isEmailValid = false;
    } else {
      emailSuccess.style.display = "inline";
      isEmailValid = true;
    }
    updateRegisterButton();
  }

  // Kiểm tra số điện thoại
  function validatePhoneInput() {
    const phoneValue = phoneInput.value.trim();
    const phonePattern = /^(0[35789])[0-9]{8}$/;
    phoneError.style.display = "none";
    phoneSuccess.style.display = "none";

    if (!phoneValue) {
      isPhoneValid = false;
    } else if (!phonePattern.test(phoneValue)) {
      phoneError.style.display = "inline";
      isPhoneValid = false;
    } else {
      phoneSuccess.style.display = "inline";
      isPhoneValid = true;
    }
    updateRegisterButton();
  }

// Cập nhật trạng thái nút đăng ký
function updateRegisterButton() {
    registerButton.disabled = !(isUsernameValid && isPasswordValid && isEmailValid && isPhoneValid);
  }

// Gắn sự kiện với debounce
const debouncedValidateUsername = debounce(validateUsernameInput, 500);
  usernameInput.addEventListener("input", debouncedValidateUsername);
  passwordInput.addEventListener("input", validatePasswordInput);
  confirmPasswordInput.addEventListener("input", validatePasswordInput);
  emailInput.addEventListener("input", validateEmailInput);
  phoneInput.addEventListener("input", validatePhoneInput);

// Lấy tất cả nút toggle và container mục lục
  const toggleButton = document.querySelector("#drug-info .toc-toggle-btn");
  const tocContainer = document.querySelector("#drug-info .toc-container");
  const overlay = document.getElementById("toc-overlay");

  // Xử lý nhấp vào nút toggle
  if (toggleButton && tocContainer && window.innerWidth <= 768) {
    toggleButton.addEventListener("click", function(event) {
      event.stopPropagation(); // Ngăn sự kiện click lan ra ngoài
      tocContainer.classList.toggle("active");
      overlay.style.display = tocContainer.classList.contains("active") ? "block" : "none";
    });
  }

  // Xử lý nhấp vào overlay để ẩn thanh mục lục
  if (overlay && tocContainer && window.innerWidth <= 768) {
    overlay.addEventListener("click", function() {
      tocContainer.classList.remove("active");
      overlay.style.display = "none";
    });
  }
});

  // Logout
  async function logout(forceLogout = false) {
    if (!forceLogout && !confirm('Bạn có chắc muốn đăng xuất?')) {
      return;
    }
    
    // Stop device validation
    stopDeviceValidation();
    
    // Hide chatbot widget
    if (typeof hideChatWidget === 'function') {
      hideChatWidget();
    }
  
    const username = sessionStorage.getItem("loggedInUser");
    const deviceId = await Auth.getDeviceId(); // Lấy deviceId từ hardware fingerprint

    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
      window.ws.close();
    }
  
    if (username && deviceId && !forceLogout) { // Chỉ gọi API khi đăng xuất thủ công
      try {

        const response = await fetch(`${BACKEND_URL}/api/logout-device-from-sheet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, deviceId }),
        });
  
        const data = await response.json();
        if (!data.success) {
          console.error("Lỗi khi xóa thiết bị:", data.message);
        } else {

        }
      } catch (error) {
        console.error("Lỗi khi gọi API xóa thiết bị:", error);
      }
    }


    sessionStorage.clear();
    localStorage.clear();
    setTimeout(() => {
      window.location.href = window.location.origin;
    }, 100);
  }

  async function logoutDevice(username, oldDeviceId, newDeviceId, newDeviceName) {

  
    const response = await fetch(`${BACKEND_URL}/api/logout-device`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, deviceId: oldDeviceId, newDeviceId, newDeviceName }), // Gửi thêm newDeviceName
    });
  
    const data = await response.json();

  
    if (data.success) {
      alert("Thiết bị đã bị đăng xuất. Bạn có thể đăng nhập lại!");
      location.reload();
    } else {
      alert("Lỗi khi đăng xuất thiết bị: " + data.message);
    }
  }

  // New function for seamless device replacement and login
  async function replaceDeviceAndLogin(username, oldDeviceId, newDeviceId, newDeviceName) {
    try {
      showSpinner();
      
      // Get password from the login form
      const password = document.getElementById("password").value.trim();
      
      if (!password) {
        alert("Vui lòng nhập mật khẩu!");
        return;
      }
      
      const response = await fetch(`${BACKEND_URL}/api/replace-device-and-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username, 
          password,
          oldDeviceId, 
          newDeviceId, 
          newDeviceName 
        }),
      });
  
      const data = await response.json();
  
      if (data.success) {
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deviceSelectionModal'));
        if (modal) {
          modal.hide();
        }
        
        // Login successful - proceed to main app
        Auth.login(username);
        document.body.classList.remove('login-active');
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("main-app").style.display = "block";
        connectWebSocket(username, newDeviceId);
        
        // Initialize chatbot after successful login
        if (typeof initializeChatbotDom === 'function') {
            initializeChatbotDom();
        }
        
        // Start new device validation system
        startDeviceValidation();
        
        // Clear error display
        const errorDisplay = document.getElementById("login-error");
        errorDisplay.style.display = "none";
        
      } else {
        alert("Lỗi khi thay thế thiết bị: " + data.message);
      }
    } catch (error) {
      console.error('Error replacing device:', error);
      alert("Đã xảy ra lỗi khi thay thế thiết bị!");
    } finally {
      hideSpinner();
    }
  }
