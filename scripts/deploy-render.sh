#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "${BLUE}🚀 Preparing Vinkit for Render deployment...${NC}"

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "${RED}❌ render.yaml not found!${NC}"
    exit 1
fi

# Check if Dockerfiles exist
if [ ! -f "backend/Dockerfile" ]; then
    echo "${RED}❌ backend/Dockerfile not found!${NC}"
    exit 1
fi

if [ ! -f "frontend/Dockerfile" ]; then
    echo "${RED}❌ frontend/Dockerfile not found!${NC}"
    exit 1
fi

# Check if nginx.conf exists
if [ ! -f "frontend/nginx.conf" ]; then
    echo "${RED}❌ frontend/nginx.conf not found!${NC}"
    exit 1
fi

echo "${GREEN}✅ All deployment files found!${NC}"

# Create production environment file
echo "${YELLOW}📝 Creating production environment file...${NC}"
cat > .env.production << EOF
# Production Environment Variables
SECRET_KEY=$(openssl rand -hex 32)
REDIS_URL=redis://localhost:6379
DATABASE_URL=sqlite:///./sql_app.db
CORS_ORIGINS=https://vinkit-frontend.onrender.com
NGINX_PORT=80
NGINX_SSL_PORT=443
FRONTEND_PORT=3000
BACKEND_PORT=8000
EOF

echo "${GREEN}✅ Production environment file created!${NC}"

# Update frontend environment variables
echo "${YELLOW}🔧 Updating frontend environment variables...${NC}"
cat > frontend/.env.production << EOF
REACT_APP_API_URL=https://vinkit-backend.onrender.com
REACT_APP_WS_URL=wss://vinkit-backend.onrender.com
GENERATE_SOURCEMAP=false
EOF

echo "${GREEN}✅ Frontend environment variables updated!${NC}"

# Update backend environment variables
echo "${YELLOW}🔧 Updating backend environment variables...${NC}"
cat > backend/.env.production << EOF
SECRET_KEY=$(openssl rand -hex 32)
REDIS_URL=redis://localhost:6379
DATABASE_URL=sqlite:///./sql_app.db
CORS_ORIGINS=https://vinkit-frontend.onrender.com
EOF

echo "${GREEN}✅ Backend environment variables updated!${NC}"

echo "${BLUE}📋 Deployment Checklist:${NC}"
echo "1. ✅ render.yaml configured"
echo "2. ✅ Dockerfiles created"
echo "3. ✅ nginx.conf configured"
echo "4. ✅ Environment variables set"
echo "5. ✅ Health check endpoint added"

echo ""
echo "${GREEN}🎉 Vinkit is ready for Render deployment!${NC}"
echo ""
echo "${YELLOW}Next steps:${NC}"
echo "1. Push your code to GitHub"
echo "2. Connect your GitHub repo to Render"
echo "3. Deploy using the render.yaml configuration"
echo "4. Update CORS_ORIGINS with your actual frontend URL"
echo ""
echo "${BLUE}Note: If you get 'must specify IP allow list' error:${NC}"
echo "  - Use render-alternative.yaml instead of render.yaml"
echo "  - Or manually configure Redis IP allow list in Render dashboard"
echo ""
echo "${BLUE}Deployment URLs will be:${NC}"
echo "  Backend: https://vinkit-backend.onrender.com"
echo "  Frontend: https://vinkit-frontend.onrender.com"
echo "  Redis: https://vinkit-redis.onrender.com"
