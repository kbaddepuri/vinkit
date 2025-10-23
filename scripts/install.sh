#!/bin/bash

# Vinkit Installation Script
# This script installs all dependencies and sets up the project

set -e

echo "🚀 Vinkit Installation Script"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
else
    echo -e "${RED}❌ Unsupported operating system: $OSTYPE${NC}"
    exit 1
fi

echo -e "${BLUE}Detected OS: $OS${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Docker
if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose
if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check Node.js (for local development)
if ! command_exists node; then
    echo -e "${YELLOW}⚠️  Node.js is not installed. Installing for local development...${NC}"
    if [[ "$OS" == "macos" ]]; then
        if command_exists brew; then
            brew install node
        else
            echo -e "${RED}❌ Homebrew not found. Please install Node.js manually.${NC}"
            exit 1
        fi
    elif [[ "$OS" == "linux" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
fi

# Check Python (for local development)
if ! command_exists python3; then
    echo -e "${YELLOW}⚠️  Python 3 is not installed. Installing for local development...${NC}"
    if [[ "$OS" == "macos" ]]; then
        if command_exists brew; then
            brew install python@3.11
        else
            echo -e "${RED}❌ Homebrew not found. Please install Python 3.11 manually.${NC}"
            exit 1
        fi
    elif [[ "$OS" == "linux" ]]; then
        sudo apt-get update
        sudo apt-get install -y python3.11 python3.11-pip python3.11-venv
    fi
fi

echo -e "${GREEN}✅ All prerequisites are installed!${NC}"

# Create environment files
echo -e "${YELLOW}Creating environment files...${NC}"
if [ ! -f .env ]; then
    cp env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
fi

if [ ! -f backend/.env ]; then
    cp backend/env.example backend/.env
    echo -e "${GREEN}✅ Created backend/.env file${NC}"
fi

if [ ! -f frontend/.env ]; then
    cp env.example frontend/.env
    echo -e "${GREEN}✅ Created frontend/.env file${NC}"
fi

# Create SSL directory
echo -e "${YELLOW}Creating SSL directory...${NC}"
mkdir -p nginx/ssl
echo -e "${GREEN}✅ Created SSL directory${NC}"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"

# Backend dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd backend
if [ -f requirements.txt ]; then
    python3 -m pip install --user -r requirements.txt
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  requirements.txt not found in backend directory${NC}"
fi
cd ..

# Frontend dependencies
echo -e "${BLUE}Installing frontend dependencies...${NC}"
cd frontend
if [ -f package.json ]; then
    npm install
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  package.json not found in frontend directory${NC}"
fi
cd ..

# Build Docker images
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build
echo -e "${GREEN}✅ Docker images built${NC}"

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose up -d

# Wait for services to start
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Check service health
echo -e "${YELLOW}Checking service health...${NC}"

# Check backend
if curl -s http://localhost:8000/ > /dev/null; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is not responding${NC}"
fi

# Check frontend
if curl -s http://localhost:3000/ > /dev/null; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend is not responding${NC}"
fi

# Check Redis
if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${RED}❌ Redis is not responding${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Installation completed successfully!${NC}"
echo ""
echo -e "${BLUE}Access your application:${NC}"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo -e "${BLUE}Demo credentials:${NC}"
echo "  Username: demo"
echo "  Password: demo"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  make help     - Show all available commands"
echo "  make start    - Start all services"
echo "  make stop     - Stop all services"
echo "  make logs     - Show service logs"
echo "  make test     - Run all tests"
echo "  make clean    - Clean up resources"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Edit .env files with your configuration"
echo "  2. Visit http://localhost:3000 to start using Vinkit"
echo "  3. Run 'make help' to see all available commands"
