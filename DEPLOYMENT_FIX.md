# 🔧 Deployment Issues - Quick Fix Guide

## Issues Detected:

1. ❌ **CORS Error**: Backend CORS is set to `http://localhost:3000` instead of `https://pollsync.vercel.app`
2. ❌ **Double Slash**: API URL has `//api` instead of `/api`
3. ❌ **Google OAuth**: Not configured for production domain

---

## 🚨 URGENT FIX #1: Backend CORS Configuration

### In Render/Railway Backend:

**Add or Update this environment variable:**

```
FRONTEND_URL=https://pollsync.vercel.app
```

**Steps:**
1. Go to your Render/Railway dashboard
2. Find your backend service
3. Go to **Environment Variables**
4. Add `FRONTEND_URL=https://pollsync.vercel.app`
5. **Save** and wait for automatic redeploy (or manually redeploy)

---

## 🚨 URGENT FIX #2: Vercel API URL (Double Slash)

### In Vercel Frontend:

**Your current URL has a double slash. Fix it:**

**WRONG:**
```
NEXT_PUBLIC_API_URL=https://pollsyncbackend.onrender.com//api
```

**CORRECT:**
```
NEXT_PUBLIC_API_URL=https://pollsyncbackend.onrender.com/api
```

**Steps:**
1. Go to Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Find `NEXT_PUBLIC_API_URL`
5. **Edit** and remove the double slash
6. Should be: `https://pollsyncbackend.onrender.com/api` (single slash)
7. Click **Save**
8. Go to **Deployments** → **Redeploy** latest deployment

---

## 🚨 FIX #3: Google OAuth Configuration

### In Google Cloud Console:

1. Go to https://console.cloud.google.com
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized JavaScript origins**, add:
   ```
   https://pollsync.vercel.app
   ```
6. Under **Authorized redirect URIs**, add:
   ```
   https://pollsync.vercel.app
   https://pollsync.vercel.app/login
   ```
7. Click **Save**
8. Wait 5 minutes for changes to propagate

---

## ✅ Complete Environment Variables Check

### Render/Railway Backend (Must Have):

```env
NODE_ENV=production
FRONTEND_URL=https://pollsync.vercel.app
MONGODB_URI=mongodb+srv://kings_db_user:%40Kings635@cluster0.5iofvxe.mongodb.net/pollsync
JWT_SECRET=pollsync_jwt_secret_key_2024_production_secure_token
KOPOKOPO_BASE_URL=https://api.kopokopo.com
KOPOKOPO_CLIENT_ID=AuQt-tU9rcyh_paUA1TMxZz5zR9YwaJhIzQZb53CseQ
KOPOKOPO_CLIENT_SECRET=2oH9TTRbY-eD9fh23rOQIKn-w3a3TL9GJqviwWtkQHk
KOPOKOPO_API_KEY=6d8c79bbad059e255bfa5d2c99d427bc9c451a24
KOPOKOPO_TILL_NUMBER=5674132
KOPOKOPO_CALLBACK_URL=https://pollsyncbackend.onrender.com/api/payment/callback
EMAIL_USER=kingscreationagency635@gmail.com
EMAIL_APP_PASSWORD=lrqlyrrrlybqwbus
```

### Vercel Frontend (Must Have):

```env
NEXT_PUBLIC_API_URL=https://pollsyncbackend.onrender.com/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=954429684706-ikbobiphrab2833c9k1ghpa74ov089us.apps.googleusercontent.com
```

---

## 📋 Step-by-Step Fix Process

### Step 1: Fix Backend CORS (Render/Railway)

1. Open Render/Railway dashboard
2. Go to your backend service
3. Click **Environment** or **Variables**
4. Look for `FRONTEND_URL`
5. If it exists, update it to: `https://pollsync.vercel.app`
6. If it doesn't exist, add it: `FRONTEND_URL=https://pollsync.vercel.app`
7. Save and wait for redeploy (2-3 minutes)

### Step 2: Fix Vercel API URL

1. Open Vercel dashboard
2. Go to your project
3. Settings → Environment Variables
4. Find `NEXT_PUBLIC_API_URL`
5. Edit it to: `https://pollsyncbackend.onrender.com/api` (remove double slash)
6. Save
7. Go to Deployments tab
8. Click "..." on latest deployment
9. Click "Redeploy"
10. Wait for deployment (1-2 minutes)

### Step 3: Fix Google OAuth

1. Go to https://console.cloud.google.com
2. Select your project
3. APIs & Services → Credentials
4. Click your OAuth Client ID
5. Add `https://pollsync.vercel.app` to:
   - Authorized JavaScript origins
   - Authorized redirect URIs
6. Save
7. Wait 5 minutes

### Step 4: Test

1. Clear browser cache (Ctrl+Shift+Delete)
2. Go to https://pollsync.vercel.app
3. Try to login
4. Should work now! ✅

---

## 🔍 Verification Commands

### Test Backend Health:
```
curl https://pollsyncbackend.onrender.com/
```

Should return:
```json
{
  "status": "ok",
  "message": "PollSync API is running",
  "environment": "production"
}
```

### Test Backend CORS:
```
curl -H "Origin: https://pollsync.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://pollsyncbackend.onrender.com/api/auth/login
```

Should return headers with:
```
Access-Control-Allow-Origin: https://pollsync.vercel.app
```

---

## 🐛 Still Having Issues?

### Check Backend Logs (Render/Railway):

1. Go to your backend service
2. Click **Logs** or **Deployments**
3. Look for errors like:
   - `FRONTEND_URL not set`
   - `CORS error`
   - `MongoDB connection failed`

### Check Vercel Logs:

1. Go to your Vercel project
2. Click **Deployments**
3. Click latest deployment
4. Click **View Function Logs**
5. Look for API connection errors

### Common Issues:

**Issue: "CORS policy error"**
- Solution: Ensure `FRONTEND_URL` is set in backend
- Redeploy backend after setting

**Issue: "net::ERR_FAILED"**
- Solution: Check API URL has no double slash
- Should be `/api` not `//api`

**Issue: "Google OAuth 403"**
- Solution: Add Vercel URL to Google Console
- Wait 5 minutes after saving

**Issue: "localhost:5000 connection refused"**
- Solution: Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check Vercel env vars are saved

---

## ✅ Final Checklist

- [ ] `FRONTEND_URL=https://pollsync.vercel.app` in backend
- [ ] Backend redeployed
- [ ] `NEXT_PUBLIC_API_URL=https://pollsyncbackend.onrender.com/api` (no double slash)
- [ ] Vercel redeployed
- [ ] Google OAuth origins updated
- [ ] Browser cache cleared
- [ ] Can access https://pollsync.vercel.app
- [ ] Can access https://pollsyncbackend.onrender.com/
- [ ] Login works
- [ ] Registration works

---

## 🎯 Quick Summary

**3 Things to Fix:**

1. **Backend**: Add `FRONTEND_URL=https://pollsync.vercel.app`
2. **Vercel**: Fix API URL (remove double slash)
3. **Google**: Add Vercel URL to OAuth settings

**Then:**
- Redeploy both services
- Clear browser cache
- Test login

**Should work in 10 minutes!** 🚀

---

## 📞 Need Help?

If still not working after these fixes:

1. Share backend logs
2. Share Vercel deployment logs
3. Share browser console errors (after fixes)
4. Check if backend is accessible: https://pollsyncbackend.onrender.com/

The main issue is CORS - backend needs to know about your Vercel URL! 🎯
