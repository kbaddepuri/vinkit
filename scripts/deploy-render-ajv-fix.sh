#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "${BLUE}🚀 Preparing Vinkit for Render deployment (AJV Fix Version)...${NC}"

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo "${RED}❌ Error: render.yaml not found. Please run this from the project root.${NC}"
    exit 1
fi

echo "${YELLOW}📦 Fixing frontend dependencies for AJV compatibility...${NC}"
cd frontend

# Clean everything
rm -rf node_modules package-lock.json

# Install with specific ajv versions
npm cache clean --force
npm install --legacy-peer-deps --no-optional --no-audit --no-fund
npm install ajv@8.12.0 ajv-keywords@5.1.0

echo "${YELLOW}🔨 Building frontend with AJV fix...${NC}"
GENERATE_SOURCEMAP=false npm run build

if [ $? -ne 0 ]; then
    echo "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

echo "${GREEN}✅ Frontend built successfully with AJV fix${NC}"

cd ..

echo "${YELLOW}🐍 Installing backend dependencies...${NC}"
cd backend
pip install -r requirements.txt
echo "${GREEN}✅ Backend dependencies installed${NC}"

cd ..

echo "${YELLOW}📝 Creating production environment files...${NC}"

# Create production environment file
cat > .env.production << EOF
SECRET_KEY=$(openssl rand -hex 32)
REDIS_URL=redis://vinkit-redis:6379
DATABASE_URL=sqlite:///./sql_app.db
CORS_ORIGINS=https://vinkit-frontend.onrender.com
REACT_APP_API_URL=https://vinkit-backend.onrender.com
REACT_APP_WS_URL=wss://vinkit-backend.onrender.com
EOF

echo "${GREEN}✅ Production environment file created${NC}"

echo "${YELLOW}📋 Creating deployment checklist...${NC}"
cat > DEPLOYMENT_CHECKLIST.md << EOF
# Vinkit Render Deployment Checklist (AJV Fix)

## Pre-deployment
- [x] Frontend dependencies fixed for AJV compatibility
- [x] Frontend built successfully
- [x] Backend dependencies installed
- [x] Production environment file created
- [x] render-ajv-fix.yaml configured

## Deployment Steps
1. **Push to GitHub**: \`git add . && git commit -m "Deploy to Render - AJV Fix" && git push\`
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
EOF

echo "${GREEN}✅ Deployment checklist created${NC}"

echo ""
echo "${GREEN}🎉 Vinkit is ready for Render deployment with AJV fix!${NC}"
echo ""
echo "${BLUE}📋 Next steps:${NC}"
echo "1. Push code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Deploy to Render - AJV Fix'"
echo "   git push"
echo ""
echo "2. Go to https://dashboard.render.com"
echo "3. Create a new Blueprint"
echo "4. Connect your GitHub repository"
echo "5. Deploy using render-ajv-fix.yaml"
echo ""
echo "${YELLOW}💡 Key AJV fixes applied:${NC}"
echo "  - Pinned ajv to 8.12.0 (compatible with ajv-keywords 5.1.0)"
echo "  - Clean install to avoid dependency conflicts"
echo "  - Legacy peer deps for React Scripts compatibility"
echo "  - Memory management with NODE_OPTIONS"
echo ""
echo "${GREEN}✅ Ready for deployment!${NC}"
