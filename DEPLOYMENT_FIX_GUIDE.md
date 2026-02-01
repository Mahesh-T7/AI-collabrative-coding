# 🚀 Deployment Fix Guide

## ✅ What Was Fixed

### 1. Backend Server (server.js)
- ✅ Added root route handler (`/`) that returns "Backend is running 🚀"
- ✅ Configured CORS to allow Vercel frontend URL
- ✅ Added credentials support for cross-origin requests
- ✅ Specified allowed HTTP methods and headers

### 2. Frontend Environment Variables
- ✅ Created `.env` file with production backend URL
- ✅ Created `.env.example` for reference
- ✅ Configured to use Render backend: `https://ai-collabrative-backend.onrender.com`

---

## 📋 Deployment Checklist

### Backend (Render)

1. **Push changes to GitHub**
   ```bash
   git add server/server.js
   git commit -m "fix: Add root route and configure CORS for Vercel"
   git push origin main
   ```

2. **Render will auto-deploy** (wait 2-3 minutes)

3. **Test the backend**
   - Open: https://ai-collabrative-backend.onrender.com
   - Should see: **"Backend is running 🚀"**
   - Test health endpoint: https://ai-collabrative-backend.onrender.com/api/health

### Frontend (Vercel)

1. **Add Environment Variable in Vercel Dashboard**
   - Go to: https://vercel.com/mahesh-ts-projects/ai-collabrative-coding
   - Settings → Environment Variables
   - Add:
     ```
     Key:   VITE_API_URL
     Value: https://ai-collabrative-backend.onrender.com
     ```
   - Apply to: Production, Preview, Development

2. **Redeploy Frontend**
   ```bash
   git add .env.example
   git commit -m "feat: Add environment configuration for API URL"
   git push origin main
   ```
   - Vercel will auto-deploy

---

## 🧪 Testing After Deployment

### 1. Test Backend Directly
```bash
# Root endpoint
curl https://ai-collabrative-backend.onrender.com

# Health check
curl https://ai-collabrative-backend.onrender.com/api/health

# Auth endpoint (should return error but proves it's accessible)
curl https://ai-collabrative-backend.onrender.com/api/auth/register
```

### 2. Test Frontend Connection
1. Open: https://ai-collabrative-coding-git-main-mahesh-ts-projects.vercel.app
2. Open Browser DevTools (F12) → Network tab
3. Try to Sign Up
4. Check Network requests:
   - Should see requests to `https://ai-collabrative-backend.onrender.com/api/auth/register`
   - Should NOT see "Network Error"
   - Should get proper API responses

### 3. Check CORS
In browser console, you should NOT see:
- ❌ "CORS policy" errors
- ❌ "Access-Control-Allow-Origin" errors

---

## 🔍 Troubleshooting

### Issue: Still getting "Network Error"

**Check:**
1. Vercel environment variable is set correctly
2. Frontend was redeployed AFTER adding env var
3. Clear browser cache (Ctrl+Shift+Delete)
4. Check browser console for actual error messages

### Issue: "Cannot GET /"

**This is NORMAL if:**
- You see it on backend URL root
- But `/api/health` works fine
- This means backend is running correctly

### Issue: CORS errors persist

**Verify:**
1. Backend has the correct Vercel URL in CORS config
2. Backend was redeployed after CORS changes
3. Frontend is using HTTPS (not HTTP)

---

## 📝 Environment Variables Reference

### Backend (.env in server/)
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=https://ai-collabrative-coding-git-main-mahesh-ts-projects.vercel.app
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
```

### Frontend (.env in root)
```env
VITE_API_URL=https://ai-collabrative-backend.onrender.com
```

---

## 🎯 What Changed in Code

### server/server.js
```javascript
// ✅ NEW: Proper CORS configuration
app.use(cors({
    origin: [
        env.CLIENT_URL,
        "https://ai-collabrative-coding-git-main-mahesh-ts-projects.vercel.app",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:5173"
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// ✅ NEW: Root route for testing
app.get("/", (req, res) => {
    res.send("Backend is running 🚀");
});
```

---

## ✨ Expected Results

After deployment:

1. ✅ Backend URL shows: "Backend is running 🚀"
2. ✅ Frontend can register/login users
3. ✅ No CORS errors in browser console
4. ✅ Network tab shows successful API calls
5. ✅ Socket.io connections work

---

## 🚨 Important Notes

- **Never commit `.env`** - It's in `.gitignore`
- **Always use environment variables** in Vercel/Render dashboards
- **Redeploy after env changes** - Changes don't apply automatically
- **Check logs** - Render and Vercel both have deployment logs

---

## 📞 Next Steps

1. Push backend changes to GitHub
2. Wait for Render to redeploy
3. Add `VITE_API_URL` to Vercel
4. Redeploy frontend
5. Test Sign Up functionality
6. Report back with results!
