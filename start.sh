#!/bin/bash

# Vinkit - Secure Distributed Video Chat
# Startup script for development and production

set -e

echo "🚀 Starting Vinkit - Secure Distributed Video Chat"
echo "=================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create environment files if they don't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration before running in production"
fi

if [ ! -f backend/.env ]; then
    echo "📝 Creating backend .env file from template..."
    cp backend/env.example backend/.env
fi

if [ ! -f frontend/.env ]; then
    echo "📝 Creating frontend .env file from template..."
    cp env.example frontend/.env
fi

# Create SSL directory for nginx
mkdir -p nginx/ssl

echo "🐳 Starting services with Docker Compose..."

# Start the services
docker-compose up -d

echo ""
echo "✅ Vinkit is starting up!"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Documentation: http://localhost:8000/docs"
echo ""
echo "🔐 Demo credentials:"
echo "   Username: demo"
echo "   Password: demo"
echo ""
echo "📊 Check service status:"
echo "   docker-compose ps"
echo ""
echo "📝 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
echo ""

# Wait a moment for services to start
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "🎉 All services are running successfully!"
else
    echo "⚠️  Some services may not be running. Check logs with: docker-compose logs"
fi
