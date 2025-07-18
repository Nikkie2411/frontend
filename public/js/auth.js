const Auth = {
    isLoggedIn: () => localStorage.getItem('isLoggedIn') === 'true',
    getUser: () => localStorage.getItem('loggedInUser'),
    getDeviceId: async () => {
      // Device ID được tạo từ hardware fingerprint, không lưu localStorage
      const { deviceId } = await getDeviceId();
      return deviceId;
    },
    login: (username) => {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('loggedInUser', username);
      // Không lưu deviceId vào localStorage nữa vì nó sẽ được tạo từ hardware
    },
    logout: () => localStorage.clear()
};

  // Initialize

  window.onload = async function() {
    // Ẩn spinner khi bắt đầu kiểm tra auth
    const spinner = document.getElementById('spinner');
    
    if (Auth.isLoggedIn()) {
      // Kiểm tra session tự động
      const valid = await checkSession();
      if (!valid) {
        // Nếu session không hợp lệ, hiển thị trang login
        spinner.style.display = 'none';
        document.getElementById('login-screen').style.display = 'block';
        return;
      }
      // Session hợp lệ, hiển thị app chính
      spinner.style.display = 'none';
      document.getElementById('main-app').style.display = 'block';
      const username = Auth.getUser();
      const deviceId = await Auth.getDeviceId();
      connectWebSocket(username, deviceId);
    } else {
      // Chưa đăng nhập, hiển thị trang login
      spinner.style.display = 'none';
      document.getElementById('login-screen').style.display = 'block';
    }
  };

  // Kiểm tra trạng thái khi tải trang - với caching
  async function checkSession() {
    const loggedInUser = localStorage.getItem("loggedInUser");
    const { deviceId } = await getDeviceId();

    if (!loggedInUser || !deviceId) return false;

    // Check cache first
    const cacheKey = `session_${loggedInUser}_${deviceId}`;
    
    try {
        console.log(`🔍 Kiểm tra session: ${loggedInUser}, DeviceID: ${deviceId}`);
        
        const result = await optimizedFetch(`${BACKEND_URL}/api/check-session`, {
            method: "POST",
            body: JSON.stringify({ username: loggedInUser, deviceId }),
        }, cacheKey, 2 * 60 * 1000); // Cache 2 minutes

        console.log("📌 Session check result:", result);

        if (!result.success) {
            // Handle error responses
            if (result.data && result.data.devices) {
                showDeviceLogoutOptions(result.data.devices, loggedInUser, deviceId, "Thiết bị hiện tại");
                return false;
            }
            if (result.data && result.data.message) {
                console.warn("⚠️ Session invalid:", result.data.message);
            }
            console.warn("⚠️ Session invalid, clearing local storage");
            localStorage.clear(); // Chỉ clear storage, không reload trang
            return false;
        }

        return true;
    } catch (error) {
        console.error("🚨 Session check error:", error);
        // Don't logout on network errors, just return false
        return !isOnline; // Return true if offline (assume session valid)
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
      console.log(`📌 Gửi request login - Username: ${username}, DeviceID: ${deviceId}`);
    }
    showSpinner();
    errorDisplay.textContent = "Đang kết nối, vui lòng đợi...";
    errorDisplay.style.color = "#00b383"; // Màu xanh để thân thiện hơn
    errorDisplay.style.display = "block";

    try {
      console.log(`📌 Login attempt - Username: ${username}, DeviceID: ${deviceId}`);
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
          document.getElementById("login-screen").style.display = "none";
          document.getElementById("main-app").style.display = "block";
          connectWebSocket(username, deviceId);
      } else {
        errorDisplay.style.color = "red";
        const data = result.data;
        
        if (data.devices) {
          showDeviceLogoutOptions(data.devices, username, deviceId, deviceName);
        } else {
          const message = data.message || "Đăng nhập thất bại!";
          alert(message);
          errorDisplay.textContent = message;
          errorDisplay.style.display = "block";
        }
      }   
    } catch (error) {
      errorDisplay.style.color = "red";
      console.error('Login error:', error);
      
      let errorMessage = "Đã xảy ra lỗi không xác định!";
      
      if (!isOnline) {
        errorMessage = "Không có kết nối mạng. Vui lòng kiểm tra kết nối!";
      } else if (error.message.includes('timeout')) {
        errorMessage = "Kết nối quá chậm. Vui lòng thử lại!";
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = "Không thể kết nối đến máy chủ. Vui lòng thử lại sau!";
      } else {
        errorMessage = error.message;
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
    console.log("🚫 Login already in progress, skipping...");
    return;
  }
  isLoginInProgress = true;
  const loginButton = document.querySelector('.btn-primary');
  if (loginButton) loginButton.disabled = true;
  try {
    await handleLogin();
  } finally {
    loginButton.disabled = false;
    isLoginInProgress = false;
  }
}, 500);

document.getElementById("password").addEventListener("keypress", (e) => {
if (e.key === "Enter") {
  console.log("⌨️ Enter pressed");
  if (!isLoginInProgress) {
    debouncedHandleLogin();
  } else {
    console.log("🚫 Enter ignored, login in progress");
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
    console.log('showRegisterModal called, bootstrap available:', typeof bootstrap !== 'undefined');
    
    // Kiểm tra xem Bootstrap đã sẵn sàng chưa
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      console.log('Using Bootstrap Modal');
      const modal = new bootstrap.Modal(document.getElementById('registerModal'));
      modal.show();
    } else {
      console.log('Using fallback modal');
      // Fallback: sử dụng jQuery nếu có hoặc hiển thị modal trực tiếp
      const modalElement = document.getElementById('registerModal');
      if (modalElement) {
        // Sử dụng jQuery Bootstrap modal nếu có
        if (typeof $ !== 'undefined' && $.fn.modal) {
          console.log('Using jQuery modal');
          $('#registerModal').modal('show');
        } else {
          console.log('Using manual modal');
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
    console.log('showForgotPasswordModal called, bootstrap available:', typeof bootstrap !== 'undefined');
    
    // Kiểm tra xem Bootstrap đã sẵn sàng chưa
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      console.log('Using Bootstrap Modal');
      const modal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
      modal.show();
    } else {
      console.log('Using fallback modal');
      // Fallback: sử dụng jQuery nếu có hoặc hiển thị modal trực tiếp
      const modalElement = document.getElementById('forgotPasswordModal');
      if (modalElement) {
        // Sử dụng jQuery Bootstrap modal nếu có
        if (typeof $ !== 'undefined' && $.fn.modal) {
          console.log('Using jQuery modal');
          $('#forgotPasswordModal').modal('show');
        } else {
          console.log('Using manual modal');
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
      console.log("📌 Phản hồi từ API send-otp:", text); // Debug
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
        console.log(`📌 Gửi yêu cầu xác minh OTP - Username: ${username}, OTP: ${otp}`);

        const response = await fetch(`${BACKEND_URL}/api/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, otp }),
        });

        const text = await response.text();
        console.log("📌 Phản hồi từ API verify-otp (thô):", text);

        const data = JSON.parse(text);
        alert(data.message);

        if (data.success) {
            console.log("✅ Xác minh OTP thành công!");
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

    if (!username || !newPassword) {
        alert("Vui lòng nhập đầy đủ thông tin!");
        return;
    }

    if (newPassword.length < 6) {
      alert("Mật khẩu mới phải dài ít nhất 6 ký tự!");
      return;
    }

    try {
        console.log(`📌 Gửi yêu cầu đổi mật khẩu - Username: ${username}`);

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
        console.log("📌 Phản hồi từ API reset-password (thô):", text);

        const data = JSON.parse(text);
        alert(data.message);

        if (data.success) {
          // Xóa thông tin đăng nhập trên trình duyệt
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("loggedInUser");
          localStorage.removeItem("deviceId");

          window.location.href = "index.html"; // Chuyển về trang đăng nhập
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
    let message = "Tài khoản đã đăng nhập trên 2 thiết bị:\n";
    devices.forEach((device, index) => {
      message += `${index + 1}. ${device.name} (${device.id.slice(0, 8)}...)\n`;
    });
    message += "Chọn thiết bị để đăng xuất (nhập số thứ tự):";
  
    const choice = prompt(message);
    if (choice && devices[choice - 1]) {
      logoutDevice(username, devices[choice - 1].id, deviceId, deviceName); // Truyền deviceName
    } else {
      alert("Không có thiết bị nào bị đăng xuất.");
    }
  }

document.getElementById("password").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      console.log("⌨️ Enter pressed");
      if (!isLoginInProgress) {
        debouncedHandleLogin();
      } else {
        console.log("🚫 Enter ignored, login in progress");
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
  
    const username = localStorage.getItem("loggedInUser");
    const deviceId = await Auth.getDeviceId(); // Lấy deviceId từ hardware fingerprint

    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
      window.ws.close();
    }
  
    if (username && deviceId && !forceLogout) { // Chỉ gọi API khi đăng xuất thủ công
      try {
        console.log(`📌 Gửi yêu cầu xóa thiết bị ${deviceId} của ${username}`);
        const response = await fetch(`${BACKEND_URL}/api/logout-device-from-sheet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, deviceId }),
        });
  
        const data = await response.json();
        if (!data.success) {
          console.error("Lỗi khi xóa thiết bị:", data.message);
        } else {
          console.log("✅ Thiết bị đã được xóa khỏi Google Sheets");
        }
      } catch (error) {
        console.error("Lỗi khi gọi API xóa thiết bị:", error);
      }
    }

    console.log("🚪 Đang đăng xuất người dùng...");
    localStorage.clear();
    setTimeout(() => {
      window.location.href = window.location.origin;
    }, 100);
  }

  async function logoutDevice(username, oldDeviceId, newDeviceId, newDeviceName) {
    console.log(`📌 Đăng xuất thiết bị ${oldDeviceId} của ${username}, thay bằng ${newDeviceId} (${newDeviceName})`);
  
    const response = await fetch(`${BACKEND_URL}/api/logout-device`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, deviceId: oldDeviceId, newDeviceId, newDeviceName }), // Gửi thêm newDeviceName
    });
  
    const data = await response.json();
    console.log("📌 Nội dung JSON:", data);
  
    if (data.success) {
      alert("Thiết bị đã bị đăng xuất. Bạn có thể đăng nhập lại!");
      location.reload();
    } else {
      alert("Lỗi khi đăng xuất thiết bị: " + data.message);
    }
  }
