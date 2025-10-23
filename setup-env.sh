#!/bin/bash

# Vinkit Environment Setup Script
# Creates environment files with proper configuration

set -e

echo "🔧 Setting up Vinkit environment files..."

# Create main .env file
cat > .env << 'EOF'
# Vinkit Environment Configuration
SECRET_KEY=vinkit-super-secret-key-$(date +%s)
REDIS_URL=redis://localhost:6379
DATABASE_URL=sqlite:///./vinkit.db

# Frontend Configuration
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
EOF

# Create backend .env file
cat > backend/.env << 'EOF'
# Backend Environment Configuration
SECRET_KEY=vinkit-backend-secret-key-$(date +%s)
REDIS_URL=redis://localhost:6379
DATABASE_URL=sqlite:///./vinkit.db
EOF

# Create frontend .env file
cat > frontend/.env << 'EOF'
# Frontend Environment Configuration
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
EOF

echo "✅ Environment files created successfully!"
echo ""
echo "📁 Created files:"
echo "  - .env (main configuration)"
echo "  - backend/.env (backend configuration)"
echo "  - frontend/.env (frontend configuration)"
echo ""
echo "🔧 You can now run: make quick-start"
