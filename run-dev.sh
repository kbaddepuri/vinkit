#!/bin/bash

# Vinkit Development Runner
# Runs the application in development mode without Docker

set -e

echo "🚀 Starting Vinkit in Development Mode"
echo "======================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if environment files exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating environment files...${NC}"
    ./setup-env.sh
fi

# Function to start backend
start_backend() {
    echo -e "${BLUE}Starting backend...${NC}"
    cd backend
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}Creating Python virtual environment...${NC}"
        python3 -m venv venv
    fi
    
    echo -e "${YELLOW}Activating virtual environment...${NC}"
    source venv/bin/activate
    
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    pip install -r requirements.txt
    
    echo -e "${YELLOW}Starting FastAPI server...${NC}"
    uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    cd ..
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}Starting frontend...${NC}"
    cd frontend
    
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
    
    echo -e "${YELLOW}Starting React development server...${NC}"
    npm start &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    cd ..
    echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
}

# Function to cleanup on exit
cleanup() {
    echo -e "${YELLOW}Stopping services...${NC}"
    if [ -f backend.pid ]; then
        kill $(cat backend.pid) 2>/dev/null || true
        rm backend.pid
    fi
    if [ -f frontend.pid ]; then
        kill $(cat frontend.pid) 2>/dev/null || true
        rm frontend.pid
    fi
    echo -e "${GREEN}✅ Services stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start services
start_backend
sleep 3
start_frontend

echo ""
echo -e "${GREEN}🎉 Vinkit is running in development mode!${NC}"
echo ""
echo -e "${BLUE}Access points:${NC}"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo -e "${BLUE}Demo credentials:${NC}"
echo "  Username: demo"
echo "  Password: demo"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for user to stop
wait
