# Deployment Checklist for attendance.sewedy.com.eg

## Pre-Deployment Tasks

### 1. Backend Configuration
- [ ] CORS is configured with production domain (already done)
- [ ] VAPID keys are in appsettings.Production.json (already done)
- [ ] Firebase Admin SDK file is present (attendance-28f89-firebase-adminsdk-fbsvc-5fb934f7da.json)
- [ ] Database connection string is correct for production
- [ ] JWT keys are secure for production

### 2. Frontend Configuration
- [ ] .env.production created with API_BASE_URL
- [ ] vite.config.js updated for production builds
- [ ] api.js updated to use production URL
- [ ] Service worker (sw.js) is properly configured

### 3. Build & Deploy

#### Backend (IIS):
```bash
cd Backend
dotnet publish -c Release -o ./publish
```
- Copy `publish` folder to IIS server
- Ensure `web.config` is in the root
- Ensure Firebase Admin SDK JSON is in the root

#### Frontend:
```bash
cd Frontend
npm run build
```
- Copy `dist` folder contents to IIS wwwroot or static file server
- Ensure service worker is deployed at `/sw.js`

### 4. IIS Configuration
- [ ] Install .NET 8.0 Hosting Bundle on server
- [ ] Create Application Pool (No Managed Code / Integrated)
- [ ] Configure website with HTTPS binding
- [ ] Set App_Data folder permissions (Write access for notifications, FCM tokens, push subscriptions)

### 5. SSL Certificate
- [ ] SSL certificate installed for attendance.sewedy.com.eg
- [ ] HTTPS redirect enabled
- [ ] Service Worker requires HTTPS to work!

### 6. Firebase Console Configuration
- [ ] Add production domain to Authorized Domains:
  - Go to Firebase Console → Project Settings → Authorized Domains
  - Add: `attendance.sewedy.com.eg`

### 7. Notification Testing Checklist
After deployment, test:
1. [ ] Login as student affair (7800)
2. [ ] Allow notification permission in browser
3. [ ] Close the browser tab
4. [ ] Mark a student absent in sessions 3-8 from another account
5. [ ] Verify push notification is received by student affair
6. [ ] Logout from student affair
7. [ ] Mark another absence
8. [ ] Verify NO notification is received (logout should remove tokens)

## Important Notes

### Service Worker Requirements:
- MUST be served over HTTPS
- MUST be at the root: `/sw.js`
- Browser will ask for notification permission

### Notification Flow:
1. Student marked absent in sessions 3-8
2. Backend checks if notifications should be sent (only sessions 3-8, only user 7800)
3. Backend saves notification to notifications.json
4. Backend sends FCM push to registered devices
5. Service worker receives push and shows notification

### Troubleshooting:
- Check browser console for "FCM token synced" message
- Check App_Data/fcm_tokens.json for registered tokens
- Check App_Data/notifications.json for created notifications
- Check browser console for service worker registration status
