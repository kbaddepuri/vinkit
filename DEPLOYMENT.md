# Vinkit Deployment Guide for Render

This guide will help you deploy Vinkit to Render.com, a cloud platform that makes it easy to deploy web services.

## 🚀 Quick Deployment

### 1. Prepare for Deployment

```bash
# Run the deployment preparation script
./scripts/deploy-render.sh
```

### 2. Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for Render deployment"

# Add your GitHub repository
git remote add origin https://github.com/yourusername/vinkit.git
git push -u origin main
```

### 3. Deploy to Render

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Click "New +" → "Blueprint"**
3. **Connect your GitHub repository**
4. **Select the `render.yaml` file**
5. **Click "Apply"**

## 📋 Services Overview

The deployment creates three services:

### Backend Service
- **Type**: Web Service
- **Runtime**: Python 3.11
- **Build Command**: `cd backend && pip install -r requirements.txt`
- **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Health Check**: `/health`

### Frontend Service
- **Type**: Static Site
- **Build Command**: `cd frontend && npm install && npm run build`
- **Publish Directory**: `frontend/build`

### Redis Service
- **Type**: Redis
- **Plan**: Starter (Free)

## 🔧 Environment Variables

### Backend Environment Variables
- `SECRET_KEY`: JWT secret key (auto-generated)
- `REDIS_URL`: Redis connection URL
- `DATABASE_URL`: Database connection URL
- `CORS_ORIGINS`: Allowed CORS origins

### Frontend Environment Variables
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_WS_URL`: WebSocket URL

## 🌐 URLs After Deployment

After successful deployment, you'll get these URLs:

- **Backend**: `https://vinkit-backend.onrender.com`
- **Frontend**: `https://vinkit-frontend.onrender.com`
- **Redis**: `https://vinkit-redis.onrender.com`

## 🔒 Security Considerations

### 1. Update CORS Origins
After deployment, update the `CORS_ORIGINS` environment variable in your backend service:

```bash
# In Render dashboard, go to your backend service
# Environment tab → Add/Update:
CORS_ORIGINS=https://vinkit-frontend.onrender.com
```

### 2. Update Frontend URLs
Update the frontend environment variables:

```bash
# In Render dashboard, go to your frontend service
# Environment tab → Add/Update:
REACT_APP_API_URL=https://vinkit-backend.onrender.com
REACT_APP_WS_URL=wss://vinkit-backend.onrender.com
```

## 🐳 Docker Deployment (Alternative)

If you prefer Docker deployment:

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoring

### Health Checks
- **Backend**: `https://vinkit-backend.onrender.com/health`
- **Frontend**: `https://vinkit-frontend.onrender.com`

### Logs
- View logs in Render dashboard
- Backend logs: WebSocket connections, API requests
- Frontend logs: Build process, static file serving

## 🔄 Updates and Maintenance

### Updating the Application
1. Make your changes locally
2. Push to GitHub
3. Render will automatically redeploy

### Database Migrations
The app uses SQLite by default. For production, consider:
- PostgreSQL for better performance
- Database backups
- Connection pooling

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Render dashboard
   - Ensure all dependencies are in requirements.txt
   - Verify Node.js and Python versions

2. **CORS Errors**
   - Update CORS_ORIGINS environment variable
   - Ensure frontend URL is included

3. **WebSocket Connection Issues**
   - Check WebSocket URL configuration
   - Verify SSL certificates

4. **Redis Connection Issues**
   - Ensure Redis service is running
   - Check REDIS_URL environment variable

### Debug Commands

```bash
# Check backend health
curl https://vinkit-backend.onrender.com/health

# Test WebSocket connection
wscat -c wss://vinkit-backend.onrender.com/ws/test

# Check frontend
curl https://vinkit-frontend.onrender.com
```

## 📈 Performance Optimization

### Backend Optimizations
- Enable Redis for session management
- Use connection pooling
- Implement caching strategies

### Frontend Optimizations
- Enable gzip compression
- Use CDN for static assets
- Implement service workers

## 🔐 Production Security

### 1. Environment Variables
- Use strong, unique SECRET_KEY
- Rotate keys regularly
- Never commit secrets to git

### 2. HTTPS
- Render provides SSL certificates automatically
- All traffic is encrypted

### 3. CORS Configuration
- Restrict CORS_ORIGINS to your domain only
- Remove localhost from production

## 📞 Support

If you encounter issues:

1. Check Render dashboard logs
2. Verify environment variables
3. Test endpoints individually
4. Check GitHub repository for updates

## 🎉 Success!

Once deployed, your Vinkit application will be available at:
- **Frontend**: `https://vinkit-frontend.onrender.com`
- **Backend API**: `https://vinkit-backend.onrender.com`
- **API Documentation**: `https://vinkit-backend.onrender.com/docs`

Enjoy your secure, distributed video chat application! 🎥✨
