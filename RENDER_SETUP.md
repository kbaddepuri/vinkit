# 🚀 Render Configuration Guide for Vinkit

This guide will walk you through deploying your Vinkit application to Render.com.

## 📋 **Prerequisites**

- GitHub account
- Render account (free at [render.com](https://render.com))
- Your Vinkit code pushed to GitHub

## 🔧 **Step 1: Push Code to GitHub**

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit for Render deployment"

# Add your GitHub repository (replace with your actual repo URL)
git remote add origin https://github.com/yourusername/vinkit.git

# Push to GitHub
git push -u origin main
```

## 🌐 **Step 2: Create Render Account & Connect GitHub**

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Sign up/Login** with your GitHub account
3. **Authorize Render** to access your GitHub repositories

## 🚀 **Step 3: Deploy Using Blueprint**

### **Option A: Blueprint Deployment (Recommended)**

1. **Click "New +" → "Blueprint"**
2. **Connect your GitHub repository**
3. **Select the `render.yaml` file**
4. **Click "Apply"**

**⚠️ If you get "must specify IP allow list" error:**
- Use `render-alternative.yaml` instead of `render.yaml`
- Or manually configure Redis IP allow list in Render dashboard

This will automatically create all three services:
- **Backend** (Python FastAPI)
- **Frontend** (React Static Site)
- **Redis** (Database)

### **Option B: Manual Service Creation**

If you prefer to create services manually:

#### **Backend Service**
1. **Click "New +" → "Web Service"**
2. **Connect your GitHub repository**
3. **Configure:**
   - **Name**: `vinkit-backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`

#### **Frontend Service**
1. **Click "New +" → "Static Site"**
2. **Connect your GitHub repository**
3. **Configure:**
   - **Name**: `vinkit-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`

#### **Redis Service**
1. **Click "New +" → "Redis"**
2. **Configure:**
   - **Name**: `vinkit-redis`
   - **Plan**: Starter (Free)

## ⚙️ **Step 4: Configure Environment Variables**

### **Backend Environment Variables**
In your backend service settings, add these environment variables:

```bash
SECRET_KEY=your-secret-key-here
REDIS_URL=redis://vinkit-redis:6379
DATABASE_URL=sqlite:///./sql_app.db
CORS_ORIGINS=https://vinkit-frontend.onrender.com
```

### **Frontend Environment Variables**
In your frontend service settings, add these environment variables:

```bash
REACT_APP_API_URL=https://vinkit-backend.onrender.com
REACT_APP_WS_URL=wss://vinkit-backend.onrender.com
GENERATE_SOURCEMAP=false
```

## 🔗 **Step 5: Update Service URLs**

After deployment, you'll get URLs like:
- **Backend**: `https://vinkit-backend.onrender.com`
- **Frontend**: `https://vinkit-frontend.onrender.com`
- **Redis**: `https://vinkit-redis.onrender.com`

### **Update CORS Origins**
1. **Go to your backend service**
2. **Environment tab**
3. **Update `CORS_ORIGINS`** with your actual frontend URL:
   ```
   CORS_ORIGINS=https://vinkit-frontend.onrender.com
   ```

### **Update Frontend API URLs**
1. **Go to your frontend service**
2. **Environment tab**
3. **Update API URLs**:
   ```
   REACT_APP_API_URL=https://vinkit-backend.onrender.com
   REACT_APP_WS_URL=wss://vinkit-backend.onrender.com
   ```

## 🔄 **Step 6: Redeploy Services**

After updating environment variables:
1. **Backend**: Click "Manual Deploy" → "Deploy latest commit"
2. **Frontend**: Click "Manual Deploy" → "Deploy latest commit"

## 🧪 **Step 7: Test Your Deployment**

### **Test Backend**
```bash
# Health check
curl https://vinkit-backend.onrender.com/health

# API docs
open https://vinkit-backend.onrender.com/docs
```

### **Test Frontend**
```bash
# Open your frontend URL
open https://vinkit-frontend.onrender.com
```

### **Test WebSocket**
```bash
# Test WebSocket connection (if you have wscat installed)
wscat -c wss://vinkit-backend.onrender.com/ws/test
```

## 🔒 **Step 8: Security Configuration**

### **Generate Strong Secret Key**
```bash
# Generate a secure secret key
openssl rand -hex 32
```

### **Update Environment Variables**
1. **Copy the generated key**
2. **Update `SECRET_KEY` in backend environment**
3. **Redeploy backend service**

## 📊 **Step 9: Monitor Your Services**

### **Render Dashboard**
- **View logs** for each service
- **Monitor performance** and usage
- **Check health status**

### **Health Endpoints**
- **Backend Health**: `https://vinkit-backend.onrender.com/health`
- **API Documentation**: `https://vinkit-backend.onrender.com/docs`

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Build Failures**
   - Check build logs in Render dashboard
   - Ensure all dependencies are in requirements.txt
   - Verify Node.js and Python versions

2. **CORS Errors**
   - Update CORS_ORIGINS environment variable
   - Ensure frontend URL is included
   - Check for typos in URLs

3. **WebSocket Connection Issues**
   - Verify WebSocket URL configuration
   - Check SSL certificates
   - Ensure backend is running

4. **Redis Connection Issues**
   - Check Redis service status
   - Verify REDIS_URL environment variable
   - Ensure Redis service is running

### **Debug Commands**

```bash
# Check backend health
curl https://vinkit-backend.onrender.com/health

# Test API endpoint
curl https://vinkit-backend.onrender.com/

# Check frontend
curl https://vinkit-frontend.onrender.com
```

## 🎉 **Success!**

Once everything is configured, your Vinkit application will be available at:

- **Frontend**: `https://vinkit-frontend.onrender.com`
- **Backend API**: `https://vinkit-backend.onrender.com`
- **API Documentation**: `https://vinkit-backend.onrender.com/docs`

## 📈 **Next Steps**

1. **Custom Domain** (Optional)
   - Add your own domain in Render dashboard
   - Update CORS_ORIGINS with your domain

2. **SSL Certificates**
   - Render provides automatic SSL
   - All traffic is encrypted

3. **Monitoring**
   - Set up alerts for service health
   - Monitor usage and performance

4. **Scaling**
   - Upgrade to paid plans for better performance
   - Add more Redis instances if needed

## 🆘 **Need Help?**

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Render Support**: [render.com/support](https://render.com/support)
- **Check logs** in Render dashboard for detailed error messages

---

**🎊 Congratulations! Your Vinkit application is now live on Render!**
