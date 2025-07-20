@echo off
echo 🚀 PedMed VNCH Frontend Deployment Script
echo ==========================================

echo.
echo 📋 Bước 1: Kiểm tra Firebase CLI...
npx firebase-tools --version
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI không có sẵn
    echo 💡 Đang cài đặt Firebase CLI...
    npm install -g firebase-tools
)

echo.
echo 📋 Bước 2: Đăng nhập Firebase...
npx firebase-tools login

echo.
echo 📋 Bước 3: Kiểm tra project...
npx firebase-tools projects:list

echo.
echo 📋 Bước 4: Deploy frontend...
npx firebase-tools deploy --only hosting

echo.
echo ✅ Deploy hoàn thành!
echo 🌐 Website URL: https://pedmed-vnch.web.app
echo 📊 Firebase Console: https://console.firebase.google.com/project/pedmed-vnch

pause
