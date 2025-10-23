#!/bin/bash

# Vinkit Production Deployment Script
# This script deploys the application to production

set -e

echo "🚀 Vinkit Production Deployment Script"
echo "======================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
DOMAIN=${2:-localhost}
SSL_EMAIL=${3:-admin@example.com}

echo -e "${BLUE}Deploying to: $ENVIRONMENT${NC}"
echo -e "${BLUE}Domain: $DOMAIN${NC}"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ This script should not be run as root${NC}"
   exit 1
fi

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Create production environment file
echo -e "${YELLOW}Creating production environment...${NC}"
if [ ! -f .env.production ]; then
    cat > .env.production << EOF
# Production Environment Variables
SECRET_KEY=$(openssl rand -hex 32)
REDIS_PASSWORD=$(openssl rand -hex 16)
DATABASE_URL=postgresql://vinkit:$(openssl rand -hex 16)@postgres:5432/vinkit
REACT_APP_API_URL=https://$DOMAIN/api
REACT_APP_WS_URL=wss://$DOMAIN/ws
GRAFANA_PASSWORD=$(openssl rand -hex 16)
EOF
    echo -e "${GREEN}✅ Production environment file created${NC}"
fi

# Generate SSL certificates if they don't exist
echo -e "${YELLOW}Setting up SSL certificates...${NC}"
if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
    echo -e "${BLUE}Generating self-signed SSL certificates...${NC}"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    echo -e "${GREEN}✅ SSL certificates generated${NC}"
    echo -e "${YELLOW}⚠️  Note: These are self-signed certificates. For production, use Let's Encrypt or a trusted CA.${NC}"
fi

# Build production images
echo -e "${YELLOW}Building production images...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache
echo -e "${GREEN}✅ Production images built${NC}"

# Stop existing services
echo -e "${YELLOW}Stopping existing services...${NC}"
docker-compose down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
echo -e "${GREEN}✅ Existing services stopped${NC}"

# Start production services
echo -e "${YELLOW}Starting production services...${NC}"
docker-compose -f docker-compose.prod.yml up -d
echo -e "${GREEN}✅ Production services started${NC}"

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 30

# Health check
echo -e "${YELLOW}Performing health checks...${NC}"

# Check backend
if curl -s -k https://$DOMAIN/api/ > /dev/null; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

# Check frontend
if curl -s -k https://$DOMAIN/ > /dev/null; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
fi

# Check Redis
if docker-compose -f docker-compose.prod.yml exec redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is healthy${NC}"
else
    echo -e "${RED}❌ Redis health check failed${NC}"
fi

# Show deployment information
echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo "  Frontend: https://$DOMAIN"
echo "  Backend:  https://$DOMAIN/api"
echo "  API Docs: https://$DOMAIN/api/docs"
echo "  Grafana:  https://$DOMAIN:3001"
echo ""
echo -e "${BLUE}Service Status:${NC}"
docker-compose -f docker-compose.prod.yml ps
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  make logs          - View service logs"
echo "  make status        - Check service status"
echo "  make restart       - Restart services"
echo "  make stop          - Stop services"
echo ""
echo -e "${YELLOW}Security Notes:${NC}"
echo "  1. Change default passwords in production"
echo "  2. Use proper SSL certificates from a trusted CA"
echo "  3. Configure firewall rules"
echo "  4. Set up monitoring and alerting"
echo "  5. Regular security updates"
echo ""
echo -e "${GREEN}Deployment completed! 🚀${NC}"
