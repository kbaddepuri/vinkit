# 🔧 Render Deployment Troubleshooting Guide

## 🚨 **Common Issues and Solutions**

### **Issue 1: "must specify IP allow list" Error**

**Problem**: Render requires IP allow list configuration for Redis services.

**Solutions**:

#### **Option A: Deploy Without Redis First**
1. Use `render-no-redis.yaml` for initial deployment
2. Manually create Redis service in Render dashboard
3. Update backend environment variables

#### **Option B: Manual Service Creation**
1. Create services individually in Render dashboard:
   - **Backend**: Web Service
   - **Frontend**: Static Site
   - **Redis**: Redis Service
2. Configure Redis IP allow list in the dashboard UI

#### **Option C: Use Alternative Configuration**
1. Try `render-simple.yaml` instead of `render.yaml`
2. Or use `render-alternative.yaml`

### **Issue 2: Build Failures**

**Problem**: Services fail to build or start.

**Solutions**:
1. **Check build logs** in Render dashboard
2. **Verify dependencies** in requirements.txt
3. **Check Node.js/Python versions**
4. **Ensure all files are committed** to GitHub

### **Issue 3: CORS Errors**

**Problem**: Frontend can't connect to backend.

**Solutions**:
1. **Update CORS_ORIGINS** in backend environment:
   ```
   CORS_ORIGINS=https://vinkit-frontend.onrender.com
   ```
2. **Check frontend API URLs**:
   ```
   REACT_APP_API_URL=https://vinkit-backend.onrender.com
   REACT_APP_WS_URL=wss://vinkit-backend.onrender.com
   ```

### **Issue 4: WebSocket Connection Issues**

**Problem**: WebSocket connections fail.

**Solutions**:
1. **Check WebSocket URL** configuration
2. **Verify SSL certificates**
3. **Check backend WebSocket endpoint**

## 📋 **Step-by-Step Manual Deployment**

If Blueprint deployment fails, follow these steps:

### **Step 1: Create Backend Service**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `vinkit-backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`

### **Step 2: Create Frontend Service**
1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `vinkit-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`

### **Step 3: Create Redis Service**
1. Click "New +" → "Redis"
2. Configure:
   - **Name**: `vinkit-redis`
   - **Plan**: Starter (Free)
3. **Configure IP Allow List** in the dashboard

### **Step 4: Update Environment Variables**

#### **Backend Environment Variables**:
```
SECRET_KEY=your-secret-key-here
REDIS_URL=redis://vinkit-redis:6379
DATABASE_URL=sqlite:///./sql_app.db
CORS_ORIGINS=https://vinkit-frontend.onrender.com
```

#### **Frontend Environment Variables**:
```
REACT_APP_API_URL=https://vinkit-backend.onrender.com
REACT_APP_WS_URL=wss://vinkit-backend.onrender.com
GENERATE_SOURCEMAP=false
```

## 🔍 **Debugging Commands**

### **Test Backend Health**
```bash
curl https://vinkit-backend.onrender.com/health
```

### **Test API Endpoints**
```bash
curl https://vinkit-backend.onrender.com/
curl https://vinkit-backend.onrender.com/docs
```

### **Test Frontend**
```bash
curl https://vinkit-frontend.onrender.com
```

### **Test WebSocket (if wscat is installed)**
```bash
wscat -c wss://vinkit-backend.onrender.com/ws/test
```

## 📊 **Monitoring and Logs**

### **View Logs**
1. Go to Render dashboard
2. Click on your service
3. Go to "Logs" tab
4. Check for errors and warnings

### **Check Service Status**
1. Go to Render dashboard
2. Check service health indicators
3. Look for any failed deployments

## 🆘 **Getting Help**

### **Render Documentation**
- [Render Docs](https://render.com/docs)
- [Render Support](https://render.com/support)

### **Common Solutions**
1. **Check service logs** for detailed error messages
2. **Verify environment variables** are set correctly
3. **Ensure all dependencies** are in requirements.txt
4. **Check GitHub repository** is connected properly

### **If All Else Fails**
1. **Delete all services** and start fresh
2. **Use manual deployment** instead of Blueprint
3. **Contact Render support** with specific error messages

## ✅ **Success Checklist**

- [ ] Backend service is running
- [ ] Frontend service is running
- [ ] Redis service is running (if using)
- [ ] Health check endpoint responds
- [ ] Frontend can connect to backend
- [ ] WebSocket connections work
- [ ] All environment variables are set
- [ ] CORS is configured correctly

## 🎉 **You're Done!**

Once all services are running, your Vinkit application will be available at:
- **Frontend**: `https://vinkit-frontend.onrender.com`
- **Backend**: `https://vinkit-backend.onrender.com`
- **API Docs**: `https://vinkit-backend.onrender.com/docs`
