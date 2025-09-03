# Vercel Deployment Checklist

## 🚨 CRITICAL: Security Issues to Fix IMMEDIATELY

### 1. Remove Sensitive Data from Git
```bash
# Add Backend/.env to .gitignore if not already there
echo "Backend/.env" >> .gitignore
git rm --cached Backend/.env
git commit -m "Remove sensitive environment file"
```

### 2. Set Environment Variables in Vercel Dashboard
For **Backend** project, add these in Vercel dashboard:
```
MONGODB_URI=mongodb+srv://hasitha:hasitha123@cluster0.l7oqly8.mongodb.net/
CLOUDINARY_API_KEY=787787581569253
CLOUDINARY_SECRET_KEY=4lnV8VKouH1a-nUlHG7bfyAI64Y
CLOUDINARY_NAME=dwjofwvdf
JWT_SECRET=hasitha123
ADMIN_EMAIL=hasitha@gmail.com
ADMIN_PASSWORD=hasitha123
STRIPE_SECRET_KEY=sk_test_51RZR5zQ8ebIjlcNUCr2xOQuVoLVPiwhchVjVM4pXJe9R9qCpGQMAuCFIZrJaYSybUBU5cJJiKDODHlEtWul7C2Ga00xypxfz5A
```

## 📋 Deployment Steps

### Step 1: Deploy Backend First
1. Create new Vercel project for Backend folder
2. Set environment variables in Vercel dashboard
3. Deploy and note the URL (e.g., `https://your-backend.vercel.app`)

### Step 2: Update Frontend & Admin URLs
Update these files with your actual backend URL:
- `Frontend/.env` → VITE_BACKEND_URL
- `admin/.env` → VITE_BACKEND_URL

### Step 3: Deploy Frontend & Admin
1. Create separate Vercel projects for Frontend and admin folders
2. Deploy both applications

## ✅ Current Status

### Ready for Deployment:
- ✅ Vercel config files exist
- ✅ Build scripts configured
- ✅ Dependencies properly defined
- ✅ Project structure is clean

### Fixed Issues:
- ✅ Updated environment URLs (placeholder - needs real backend URL)

### Remaining Tasks:
- ❌ Remove Backend/.env from git
- ❌ Set environment variables in Vercel
- ❌ Deploy backend and get production URL
- ❌ Update frontend/admin with real backend URL
- ❌ Deploy frontend and admin

## 🔧 Additional Recommendations

### 1. Add Build Optimization
Consider adding these to your Vite configs for better production builds:

```javascript
// Frontend/vite.config.js & admin/vite.config.js
export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  }
})
```

### 2. Add CORS Configuration
Ensure your backend allows requests from your frontend domains:

```javascript
// Backend/Server.js - Update CORS configuration
app.use(cors({
  origin: [
    'https://your-frontend.vercel.app',
    'https://your-admin.vercel.app',
    'http://localhost:5173', // for development
    'http://localhost:5174'  // for development
  ]
}));
```

### 3. Environment-Specific Configurations
Consider using different environment files for development and production.

## 🚀 Deployment Order
1. **Backend** (get the URL first)
2. **Frontend** (update with backend URL)
3. **Admin** (update with backend URL)

Your project structure is solid and ready for Vercel once these security and configuration issues are resolved!