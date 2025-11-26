# 🔐 Environment Variables Configuration Guide

## ✅ Backend is Running!
Your backend API is live and responding correctly:
```json
{
  "status": "ok",
  "message": "PollSync API is running",
  "environment": "production",
  "timestamp": "2025-11-26T06:11:50.456Z"
}
```

---

## 🚂 Railway (Backend) Environment Variables

### How to Add Variables in Railway:
1. Go to your Railway project dashboard
2. Click on your service
3. Go to **"Variables"** tab
4. Click **"New Variable"**
5. Add each variable below

### Required Variables:

```env
# Node Environment
NODE_ENV=production

# Frontend URL (CRITICAL - Must match your Vercel deployment)
FRONTEND_URL=https://pollsync.vercel.app

# MongoDB Connection (Get from MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pollsync?retryWrites=true&w=majority

# JWT Secret (Generate a strong random string - minimum 32 characters)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long_random_string

# Kopokopo Payment Gateway (Get from Kopokopo Dashboard)
KOPOKOPO_CLIENT_ID=your_kopokopo_client_id_here
KOPOKOPO_CLIENT_SECRET=your_kopokopo_client_secret_here
KOPOKOPO_API_KEY=your_kopokopo_api_key_here

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-16-character-app-password
```

### Optional Variables (Recommended):

```env
# Kopokopo Additional Settings
KOPOKOPO_BASE_URL=https://api.kopokopo.com
KOPOKOPO_TILL_NUMBER=your_till_number
KOPOKOPO_CALLBACK_URL=https://your-railway-url.up.railway.app/api/payment/callback

# Cloudinary (If using for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## ▲ Vercel (Frontend) Environment Variables

### How to Add Variables in Vercel:
1. Go to https://vercel.com/dashboard
2. Select your **pollsync** project
3. Go to **Settings** → **Environment Variables**
4. Add each variable below
5. Select **Production**, **Preview**, and **Development** for each
6. Click **"Save"**

### Required Variables:

```env
# Backend API URL (CRITICAL - Must match your Railway deployment)
NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app/api

# Google OAuth Client ID (Get from Google Cloud Console)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
```

### Example with Real Railway URL:
```env
NEXT_PUBLIC_API_URL=https://pollsync-production.up.railway.app/api
```

---

## 📋 Step-by-Step Setup Guide

### Step 1: Get Your Railway Backend URL

1. Go to Railway dashboard
2. Click on your backend service
3. Go to **Settings** → **Networking**
4. Click **"Generate Domain"** if not already done
5. Copy the URL (e.g., `https://pollsync-production.up.railway.app`)

### Step 2: Configure Railway Variables

Copy and paste these into Railway (replace with your actual values):

```env
NODE_ENV=production
FRONTEND_URL=https://pollsync.vercel.app
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/pollsync?retryWrites=true&w=majority
JWT_SECRET=GENERATE_A_STRONG_RANDOM_STRING_HERE_MIN_32_CHARS
KOPOKOPO_CLIENT_ID=YOUR_KOPOKOPO_CLIENT_ID
KOPOKOPO_CLIENT_SECRET=YOUR_KOPOKOPO_CLIENT_SECRET
KOPOKOPO_API_KEY=YOUR_KOPOKOPO_API_KEY
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

### Step 3: Configure Vercel Variables

1. Update `NEXT_PUBLIC_API_URL` in Vercel:
```env
NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app/api
```

2. Add Google OAuth if not already added:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### Step 4: Redeploy Vercel

1. Go to Vercel dashboard
2. Click **"Deployments"** tab
3. Click the three dots on latest deployment
4. Click **"Redeploy"**
5. Wait for deployment to complete

---

## 🔑 How to Get Each Credential

### MongoDB Atlas Connection String

1. Go to https://cloud.mongodb.com
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string
5. Replace `<username>` and `<password>` with your database user credentials
6. Replace `<dbname>` with `pollsync`

**Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/pollsync?retryWrites=true&w=majority
```

### JWT Secret

Generate a strong random string (minimum 32 characters):

**Option 1: Online Generator**
- Visit: https://randomkeygen.com/
- Use "CodeIgniter Encryption Keys" or "Fort Knox Passwords"

**Option 2: Command Line**
```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Option 3: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Kopokopo Credentials

1. Go to https://app.kopokopo.com
2. Sign in to your account
3. Go to **Settings** → **API Keys**
4. Copy:
   - Client ID
   - Client Secret
   - API Key
5. For testing, use **Sandbox** credentials
6. For production, use **Live** credentials

### Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not enabled)
3. Go to https://myaccount.google.com/apppasswords
4. Select **"Mail"** and **"Other (Custom name)"**
5. Enter "PollSync" as the name
6. Click **"Generate"**
7. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)
8. Use this password in `EMAIL_APP_PASSWORD`

### Google OAuth Client ID

1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **"Create Credentials"** → **"OAuth client ID"**
5. Choose **"Web application"**
6. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `https://pollsync.vercel.app` (for production)
7. Add authorized redirect URIs:
   - `http://localhost:3000` (for development)
   - `https://pollsync.vercel.app` (for production)
8. Copy the **Client ID**

---

## ✅ Verification Checklist

### Railway Backend:
- [ ] `NODE_ENV` set to `production`
- [ ] `FRONTEND_URL` matches Vercel URL exactly
- [ ] `MONGODB_URI` is valid and accessible
- [ ] `JWT_SECRET` is at least 32 characters
- [ ] All Kopokopo credentials added
- [ ] Gmail credentials added
- [ ] Backend URL generated
- [ ] Health check works: `https://your-railway-url.up.railway.app/`

### Vercel Frontend:
- [ ] `NEXT_PUBLIC_API_URL` matches Railway URL + `/api`
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` added
- [ ] Variables applied to Production, Preview, Development
- [ ] Frontend redeployed after adding variables
- [ ] Can access: `https://pollsync.vercel.app`

### MongoDB Atlas:
- [ ] Database user created with read/write permissions
- [ ] Network access allows all IPs (`0.0.0.0/0`)
- [ ] Database name is `pollsync`
- [ ] Connection string tested

### Integration Tests:
- [ ] Can register new user
- [ ] Can login
- [ ] Can create organization
- [ ] Can create election
- [ ] Real-time updates work
- [ ] Payment processing works
- [ ] Email notifications work

---

## 🐛 Troubleshooting

### Issue: "CORS Error" in Browser Console

**Solution:**
1. Check `FRONTEND_URL` in Railway matches Vercel URL exactly
2. Ensure no trailing slash in URLs
3. Redeploy Railway after changing CORS settings

### Issue: "Cannot connect to backend"

**Solution:**
1. Verify `NEXT_PUBLIC_API_URL` in Vercel is correct
2. Check Railway logs for errors
3. Test backend health: `https://your-railway-url.up.railway.app/`
4. Ensure Railway service is running

### Issue: "MongoDB connection failed"

**Solution:**
1. Check `MONGODB_URI` format is correct
2. Verify username and password are correct
3. Ensure MongoDB Atlas allows connections from anywhere (`0.0.0.0/0`)
4. Check database user has proper permissions

### Issue: "JWT malformed" or "Invalid token"

**Solution:**
1. Ensure `JWT_SECRET` is the same in Railway
2. Clear browser cookies and localStorage
3. Try logging in again

### Issue: "Email not sending"

**Solution:**
1. Verify `EMAIL_USER` is correct Gmail address
2. Check `EMAIL_APP_PASSWORD` is 16-character app password (not regular password)
3. Ensure 2-Step Verification is enabled on Gmail
4. Check Railway logs for email errors

### Issue: "Payment webhook not working"

**Solution:**
1. Update Kopokopo webhook URL to Railway URL
2. Format: `https://your-railway-url.up.railway.app/api/payment/callback`
3. Ensure webhook endpoint is accessible
4. Check Railway logs for webhook requests

---

## 📊 Environment Variables Summary

### Railway (8 Required + 4 Optional)

**Required:**
1. `NODE_ENV`
2. `FRONTEND_URL`
3. `MONGODB_URI`
4. `JWT_SECRET`
5. `KOPOKOPO_CLIENT_ID`
6. `KOPOKOPO_CLIENT_SECRET`
7. `KOPOKOPO_API_KEY`
8. `EMAIL_USER`
9. `EMAIL_APP_PASSWORD`

**Optional:**
1. `KOPOKOPO_BASE_URL`
2. `KOPOKOPO_TILL_NUMBER`
3. `CLOUDINARY_CLOUD_NAME`
4. `CLOUDINARY_API_KEY`

### Vercel (2 Required)

1. `NEXT_PUBLIC_API_URL`
2. `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

---

## 🚀 Quick Copy-Paste Templates

### For Railway:
```env
NODE_ENV=production
FRONTEND_URL=https://pollsync.vercel.app
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pollsync?retryWrites=true&w=majority
JWT_SECRET=your_32_character_minimum_secret_key_here
KOPOKOPO_CLIENT_ID=your_client_id
KOPOKOPO_CLIENT_SECRET=your_client_secret
KOPOKOPO_API_KEY=your_api_key
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

### For Vercel:
```env
NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## 📞 Need Help?

If you encounter issues:
1. Check Railway logs: Railway Dashboard → Your Service → Deployments → View Logs
2. Check Vercel logs: Vercel Dashboard → Your Project → Deployments → View Function Logs
3. Test backend health: `https://your-railway-url.up.railway.app/api/health`
4. Test frontend: `https://pollsync.vercel.app`

---

## ✨ Success!

Once all variables are set correctly:
- ✅ Backend responds at Railway URL
- ✅ Frontend loads at Vercel URL
- ✅ Users can register and login
- ✅ Elections can be created
- ✅ Payments process successfully
- ✅ Emails send correctly
- ✅ Real-time updates work

**Your PollSync platform is now fully deployed and operational!** 🎉
