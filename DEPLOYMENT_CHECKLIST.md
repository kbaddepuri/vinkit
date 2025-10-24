# Vinkit Render Deployment Checklist (AJV Fix)

## Pre-deployment
- [x] Frontend dependencies fixed for AJV compatibility
- [x] Frontend built successfully
- [x] Backend dependencies installed
- [x] Production environment file created
- [x] render-ajv-fix.yaml configured

## Deployment Steps
1. **Push to GitHub**: `git add . && git commit -m "Deploy to Render - AJV Fix" && git push`
2. **Connect to Render**: Go to https://dashboard.render.com
3. **Create Blueprint**: Use the render-ajv-fix.yaml file
4. **Deploy Services**: Render will deploy all services automatically

## Service URLs (after deployment)
- Frontend: https://vinkit-frontend.onrender.com
- Backend: https://vinkit-backend.onrender.com
- API Docs: https://vinkit-backend.onrender.com/docs

## AJV Fixes Applied
- Pinned ajv to version 8.12.0
- Pinned ajv-keywords to version 5.1.0
- Used legacy-peer-deps to avoid conflicts
- Disabled source map generation for faster builds
- Added NODE_OPTIONS for memory management
- Cleaned node_modules and package-lock.json before install

## Troubleshooting
- If frontend fails: Check Node.js version (should be 18.x or 20.x)
- If backend fails: Check Python version (should be 3.10+)
- If Redis fails: Check Redis service status
- Check logs in Render dashboard for specific errors

## Environment Variables
All environment variables are configured in render-ajv-fix.yaml:
- SECRET_KEY: Auto-generated
- REDIS_URL: Points to Redis service
- CORS_ORIGINS: Frontend URL
- REACT_APP_API_URL: Backend URL
- REACT_APP_WS_URL: WebSocket URL
- NODE_OPTIONS: Memory management
- GENERATE_SOURCEMAP: Disabled for faster builds
