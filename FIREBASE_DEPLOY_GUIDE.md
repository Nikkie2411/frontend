# 🔥 Firebase Frontend Deployment Guide

## 📋 **Chuẩn bị**
- ✅ Backend đã deploy lên Render
- ✅ Frontend BACKEND_URL đã cấu hình đúng
- ✅ Firebase project `pedmed-vnch` đã tồn tại

## 🚀 **Cách 1: Sử dụng Script (Khuyến nghị)**

```bash
# Chạy script deploy tự động
deploy-firebase.bat
```

## 🚀 **Cách 2: Manual Steps**

### Bước 1: Cài đặt Firebase CLI
```bash
npm install -g firebase-tools
```

### Bước 2: Đăng nhập Firebase
```bash
firebase login
```

### Bước 3: Kiểm tra project
```bash
firebase projects:list
firebase use pedmed-vnch
```

### Bước 4: Deploy
```bash
firebase deploy --only hosting
```

## 🎯 **Kết quả sau khi deploy**

- **Production URL**: https://pedmed-vnch.web.app
- **Alternative URL**: https://pedmed-vnch.firebaseapp.com
- **Firebase Console**: https://console.firebase.google.com/project/pedmed-vnch

## 🔧 **Troubleshooting**

### PowerShell Execution Policy Issues
```bash
# Sử dụng Command Prompt thay vì PowerShell
cmd
npm install -g firebase-tools
firebase deploy
```

### Authentication Issues
```bash
firebase logout
firebase login --reauth
```

### Project Selection Issues
```bash
firebase use --add
# Chọn pedmed-vnch từ danh sách
```

## ✅ **Post-Deployment Checklist**

- [ ] Website accessible tại https://pedmed-vnch.web.app
- [ ] Backend API calls hoạt động (check Network tab)
- [ ] Login/Register functions
- [ ] Device limit security hoạt động
- [ ] Drug search functionality
- [ ] Responsive design trên mobile

## 🔄 **Future Deployments**

Sau lần đầu setup, chỉ cần:
```bash
firebase deploy
```

## 📊 **Monitoring**

- **Firebase Console**: https://console.firebase.google.com/project/pedmed-vnch/hosting
- **Analytics**: Firebase Analytics dashboard
- **Performance**: Web Vitals trong Firebase Console
