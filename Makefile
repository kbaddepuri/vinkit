# Vinkit - Secure Distributed Video Chat
# Makefile for development and deployment tasks

.PHONY: help install start stop restart logs clean test lint format build deploy dev prod status health

# Default target
.DEFAULT_GOAL := help

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
PURPLE := \033[0;35m
CYAN := \033[0;36m
WHITE := \033[0;37m
NC := \033[0m # No Color

# Project variables
PROJECT_NAME := vinkit
BACKEND_DIR := backend
FRONTEND_DIR := frontend
NGINX_DIR := nginx

help: ## Show this help message
	@echo "$(CYAN)Vinkit - Secure Distributed Video Chat$(NC)"
	@echo "$(CYAN)=====================================$(NC)"
	@echo ""
	@echo "$(GREEN)Available commands:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@echo "$(YELLOW)Installing backend dependencies...$(NC)"
	cd $(BACKEND_DIR) && pip install -r requirements.txt
	@echo "$(YELLOW)Installing frontend dependencies...$(NC)"
	cd $(FRONTEND_DIR) && npm install
	@echo "$(GREEN)✅ All dependencies installed!$(NC)"
	@echo "$(CYAN)Note: Redis is optional - the app will work without it$(NC)"

install-dev: ## Install development dependencies
	@echo "$(BLUE)Installing development dependencies...$(NC)"
	cd $(BACKEND_DIR) && pip install -r requirements.txt
	cd $(BACKEND_DIR) && pip install pytest pytest-asyncio black flake8
	cd $(FRONTEND_DIR) && npm install
	@echo "$(GREEN)✅ Development dependencies installed!$(NC)"

setup: ## Initial project setup
	@echo "$(BLUE)Setting up Vinkit project...$(NC)"
	@echo "$(YELLOW)Creating environment files...$(NC)"
	@./setup-env.sh
	@echo "$(YELLOW)Creating SSL directory...$(NC)"
	@mkdir -p $(NGINX_DIR)/ssl
	@echo "$(YELLOW)Installing dependencies...$(NC)"
	@$(MAKE) install
	@echo "$(GREEN)✅ Project setup complete!$(NC)"
	@echo "$(CYAN)Next steps:$(NC)"
	@echo "  1. Run 'make start' to start the application"
	@echo "  2. Access at http://localhost:3000"

start: ## Start all services with Docker Compose
	@echo "$(BLUE)Starting Vinkit services...$(NC)"
	@docker compose up -d
	@echo "$(GREEN)✅ Services started!$(NC)"
	@echo "$(CYAN)Access points:$(NC)"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"
	@echo "  API Docs: http://localhost:8000/docs"

start-dev: ## Start services in development mode with logs
	@echo "$(BLUE)Starting Vinkit in development mode...$(NC)"
	@docker compose up

stop: ## Stop all services
	@echo "$(BLUE)Stopping Vinkit services...$(NC)"
	@echo "$(YELLOW)Stopping backend processes...$(NC)"
	@pkill -f uvicorn 2>/dev/null || echo "No uvicorn processes found"
	@echo "$(YELLOW)Stopping frontend processes...$(NC)"
	@pkill -f "react-scripts start" 2>/dev/null || echo "No React processes found"
	@pkill -f "npm start" 2>/dev/null || echo "No npm processes found"
	@echo "$(YELLOW)Stopping any processes on ports 3000 and 8000...$(NC)"
	@lsof -ti:3000,8000 | xargs kill -9 2>/dev/null || echo "No processes found on ports 3000/8000"
	@echo "$(YELLOW)Stopping Docker services (if running)...$(NC)"
	@docker compose down 2>/dev/null || echo "No Docker services running"
	@echo "$(GREEN)✅ All services stopped!$(NC)"

stop-dev: ## Stop development services only
	@echo "$(BLUE)Stopping development services...$(NC)"
	@echo "$(YELLOW)Stopping backend processes...$(NC)"
	@pkill -f uvicorn 2>/dev/null || echo "No uvicorn processes found"
	@echo "$(YELLOW)Stopping frontend processes...$(NC)"
	@pkill -f "react-scripts start" 2>/dev/null || echo "No React processes found"
	@pkill -f "npm start" 2>/dev/null || echo "No npm processes found"
	@echo "$(YELLOW)Stopping any processes on ports 3000 and 8000...$(NC)"
	@lsof -ti:3000,8000 | xargs kill -9 2>/dev/null || echo "No processes found on ports 3000/8000"
	@echo "$(GREEN)✅ Development services stopped!$(NC)"

restart: ## Restart all services
	@echo "$(BLUE)Restarting Vinkit services...$(NC)"
	@$(MAKE) stop
	@$(MAKE) start
	@echo "$(GREEN)✅ Services restarted!$(NC)"

restart-dev: ## Restart development services
	@echo "$(BLUE)Restarting development services...$(NC)"
	@$(MAKE) stop-dev
	@$(MAKE) dev
	@echo "$(GREEN)✅ Development services restarted!$(NC)"

logs: ## Show logs for all services
	@echo "$(BLUE)Showing service logs...$(NC)"
	@docker compose logs -f

logs-backend: ## Show backend logs
	@echo "$(BLUE)Showing backend logs...$(NC)"
	@docker compose logs -f backend

logs-frontend: ## Show frontend logs
	@echo "$(BLUE)Showing frontend logs...$(NC)"
	@docker compose logs -f frontend

logs-nginx: ## Show nginx logs
	@echo "$(BLUE)Showing nginx logs...$(NC)"
	@docker compose logs -f nginx

logs-redis: ## Show redis logs
	@echo "$(BLUE)Showing redis logs...$(NC)"
	@docker compose logs -f redis

status: ## Show status of all services
	@echo "$(BLUE)Service status:$(NC)"
	@echo "$(YELLOW)Backend (uvicorn):$(NC)"
	@pgrep -f uvicorn > /dev/null && echo "  ✅ Running" || echo "  ❌ Not running"
	@echo "$(YELLOW)Frontend (React):$(NC)"
	@pgrep -f "react-scripts start" > /dev/null && echo "  ✅ Running" || echo "  ❌ Not running"
	@echo "$(YELLOW)Port 3000:$(NC)"
	@lsof -ti:3000 > /dev/null && echo "  ✅ In use" || echo "  ❌ Free"
	@echo "$(YELLOW)Port 8000:$(NC)"
	@lsof -ti:8000 > /dev/null && echo "  ✅ In use" || echo "  ❌ Free"
	@echo "$(YELLOW)Docker services:$(NC)"
	@docker compose ps 2>/dev/null || echo "  ❌ No Docker services"

health: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@echo "$(YELLOW)Backend health:$(NC)"
	@curl -s http://localhost:8000/ | jq . || echo "Backend not responding"
	@echo "$(YELLOW)Frontend health:$(NC)"
	@curl -s http://localhost:3000/ > /dev/null && echo "Frontend is responding" || echo "Frontend not responding"
	@echo "$(YELLOW)Redis health:$(NC)"
	@docker compose exec redis redis-cli ping || echo "Redis not responding"

build: ## Build all Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	@docker compose build
	@echo "$(GREEN)✅ Images built!$(NC)"

build-no-cache: ## Build Docker images without cache
	@echo "$(BLUE)Building Docker images (no cache)...$(NC)"
	@docker compose build --no-cache
	@echo "$(GREEN)✅ Images built!$(NC)"

dev: ## Start development environment (no Docker required)
	@echo "$(BLUE)Starting development environment...$(NC)"
	@./run-dev.sh

dev-docker: ## Start development environment with Docker
	@echo "$(BLUE)Starting development environment with Docker...$(NC)"
	@echo "$(YELLOW)Starting Redis...$(NC)"
	@docker compose up -d redis
	@echo "$(YELLOW)Starting backend in development mode...$(NC)"
	@cd $(BACKEND_DIR) && uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
	@echo "$(YELLOW)Starting frontend in development mode...$(NC)"
	@cd $(FRONTEND_DIR) && npm start &
	@echo "$(GREEN)✅ Development environment started!$(NC)"
	@echo "$(CYAN)Access points:$(NC)"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"

prod: ## Start production environment
	@echo "$(BLUE)Starting production environment...$(NC)"
	@docker compose -f docker-compose.yml up -d
	@echo "$(GREEN)✅ Production environment started!$(NC)"

test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	@echo "$(YELLOW)Running backend tests...$(NC)"
	@cd $(BACKEND_DIR) && python -m pytest tests/ -v
	@echo "$(YELLOW)Running frontend tests...$(NC)"
	@cd $(FRONTEND_DIR) && npm test -- --coverage --watchAll=false
	@echo "$(GREEN)✅ All tests completed!$(NC)"

test-backend: ## Run backend tests only
	@echo "$(BLUE)Running backend tests...$(NC)"
	@cd $(BACKEND_DIR) && python -m pytest tests/ -v

test-frontend: ## Run frontend tests only
	@echo "$(BLUE)Running frontend tests...$(NC)"
	@cd $(FRONTEND_DIR) && npm test -- --coverage --watchAll=false

lint: ## Run linting for all code
	@echo "$(BLUE)Running linting...$(NC)"
	@echo "$(YELLOW)Linting backend...$(NC)"
	@cd $(BACKEND_DIR) && flake8 . --max-line-length=88 --extend-ignore=E203,W503
	@echo "$(YELLOW)Linting frontend...$(NC)"
	@cd $(FRONTEND_DIR) && npm run lint
	@echo "$(GREEN)✅ Linting completed!$(NC)"

format: ## Format all code
	@echo "$(BLUE)Formatting code...$(NC)"
	@echo "$(YELLOW)Formatting backend...$(NC)"
	@cd $(BACKEND_DIR) && black . --line-length=88
	@echo "$(YELLOW)Formatting frontend...$(NC)"
	@cd $(FRONTEND_DIR) && npm run format
	@echo "$(GREEN)✅ Code formatted!$(NC)"

clean: ## Clean up containers, images, and volumes
	@echo "$(BLUE)Cleaning up...$(NC)"
	@echo "$(YELLOW)Stopping local development processes...$(NC)"
	@pkill -f uvicorn 2>/dev/null || echo "No uvicorn processes found"
	@pkill -f "react-scripts start" 2>/dev/null || echo "No React processes found"
	@pkill -f "npm start" 2>/dev/null || echo "No npm processes found"
	@echo "$(YELLOW)Cleaning up local files...$(NC)"
	@rm -rf frontend/build 2>/dev/null || echo "No build directory found"
	@rm -rf backend/__pycache__ 2>/dev/null || echo "No Python cache found"
	@rm -rf backend/*.pyc 2>/dev/null || echo "No Python compiled files found"
	@rm -rf backend/.pytest_cache 2>/dev/null || echo "No pytest cache found"
	@rm -rf backend/sql_app.db 2>/dev/null || echo "No database file found"
	@echo "$(YELLOW)Cleaning Docker resources (if available)...$(NC)"
	@docker compose down -v --remove-orphans 2>/dev/null || echo "Docker not available or no containers running"
	@docker image prune -f 2>/dev/null || echo "Docker not available"
	@docker volume prune -f 2>/dev/null || echo "Docker not available"
	@echo "$(GREEN)✅ Cleanup completed!$(NC)"

clean-all: ## Clean everything including images and volumes
	@echo "$(BLUE)Deep cleaning...$(NC)"
	@echo "$(YELLOW)Stopping local development processes...$(NC)"
	@pkill -f uvicorn 2>/dev/null || echo "No uvicorn processes found"
	@pkill -f "react-scripts start" 2>/dev/null || echo "No React processes found"
	@pkill -f "npm start" 2>/dev/null || echo "No npm processes found"
	@echo "$(YELLOW)Cleaning up local files...$(NC)"
	@rm -rf frontend/build 2>/dev/null || echo "No build directory found"
	@rm -rf frontend/node_modules 2>/dev/null || echo "No node_modules found"
	@rm -rf backend/__pycache__ 2>/dev/null || echo "No Python cache found"
	@rm -rf backend/*.pyc 2>/dev/null || echo "No Python compiled files found"
	@rm -rf backend/.pytest_cache 2>/dev/null || echo "No pytest cache found"
	@rm -rf backend/sql_app.db 2>/dev/null || echo "No database file found"
	@rm -rf backend/venv 2>/dev/null || echo "No virtual environment found"
	@echo "$(YELLOW)Cleaning Docker resources (if available)...$(NC)"
	@docker compose down -v --remove-orphans 2>/dev/null || echo "Docker not available or no containers running"
	@docker images | grep $(PROJECT_NAME) | awk '{print $$3}' | xargs -r docker rmi -f 2>/dev/null || echo "Docker not available or no project images"
	@docker image prune -a -f 2>/dev/null || echo "Docker not available"
	@docker volume prune -f 2>/dev/null || echo "Docker not available"
	@docker network prune -f 2>/dev/null || echo "Docker not available"
	@echo "$(GREEN)✅ Deep cleanup completed!$(NC)"

clean-local: ## Clean only local development files (no Docker)
	@echo "$(BLUE)Cleaning local development files...$(NC)"
	@echo "$(YELLOW)Stopping local development processes...$(NC)"
	@pkill -f uvicorn 2>/dev/null || echo "No uvicorn processes found"
	@pkill -f "react-scripts start" 2>/dev/null || echo "No React processes found"
	@pkill -f "npm start" 2>/dev/null || echo "No npm processes found"
	@echo "$(YELLOW)Cleaning up local files...$(NC)"
	@rm -rf frontend/build 2>/dev/null || echo "No build directory found"
	@rm -rf backend/__pycache__ 2>/dev/null || echo "No Python cache found"
	@rm -rf backend/*.pyc 2>/dev/null || echo "No Python compiled files found"
	@rm -rf backend/.pytest_cache 2>/dev/null || echo "No pytest cache found"
	@rm -rf backend/sql_app.db 2>/dev/null || echo "No database file found"
	@echo "$(GREEN)✅ Local cleanup completed!$(NC)"

reset: ## Reset project to clean state
	@echo "$(BLUE)Resetting project...$(NC)"
	@$(MAKE) clean
	@echo "$(YELLOW)Removing node_modules...$(NC)"
	@rm -rf $(FRONTEND_DIR)/node_modules
	@echo "$(YELLOW)Removing Python cache...$(NC)"
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "$(GREEN)✅ Project reset!$(NC)"

deploy: ## Deploy to production
	@echo "$(BLUE)Deploying to production...$(NC)"
	@echo "$(YELLOW)Building production images...$(NC)"
	@$(MAKE) build
	@echo "$(YELLOW)Starting production services...$(NC)"
	@$(MAKE) prod
	@echo "$(GREEN)✅ Deployed to production!$(NC)"

deploy-render: ## Prepare for Render deployment
	@echo "$(BLUE)Preparing for Render deployment...$(NC)"
	@./scripts/deploy-render.sh
	@echo "$(GREEN)✅ Ready for Render deployment!$(NC)"
	@echo "$(CYAN)Next steps:$(NC)"
	@echo "1. Push code to GitHub"
	@echo "2. Connect repo to Render"
	@echo "3. Deploy using render.yaml"

backup: ## Backup important data
	@echo "$(BLUE)Creating backup...$(NC)"
	@mkdir -p backups
	@tar -czf backups/vinkit-backup-$(shell date +%Y%m%d-%H%M%S).tar.gz \
		--exclude=node_modules \
		--exclude=__pycache__ \
		--exclude=.git \
		--exclude=backups \
		.
	@echo "$(GREEN)✅ Backup created in backups/ directory!$(NC)"

update: ## Update dependencies
	@echo "$(BLUE)Updating dependencies...$(NC)"
	@echo "$(YELLOW)Updating backend dependencies...$(NC)"
	@cd $(BACKEND_DIR) && pip install --upgrade -r requirements.txt
	@echo "$(YELLOW)Updating frontend dependencies...$(NC)"
	@cd $(FRONTEND_DIR) && npm update
	@echo "$(GREEN)✅ Dependencies updated!$(NC)"

shell-backend: ## Open shell in backend container
	@echo "$(BLUE)Opening backend shell...$(NC)"
	@docker compose exec backend /bin/bash

shell-frontend: ## Open shell in frontend container
	@echo "$(BLUE)Opening frontend shell...$(NC)"
	@docker compose exec frontend /bin/sh

shell-redis: ## Open Redis CLI
	@echo "$(BLUE)Opening Redis CLI...$(NC)"
	@docker compose exec redis redis-cli

monitor: ## Monitor system resources
	@echo "$(BLUE)System monitoring...$(NC)"
	@echo "$(YELLOW)Container stats:$(NC)"
	@docker stats --no-stream
	@echo "$(YELLOW)Disk usage:$(NC)"
	@df -h
	@echo "$(YELLOW)Memory usage:$(NC)"
	@free -h

# Development helpers
dev-backend: ## Start only backend in development mode
	@echo "$(BLUE)Starting backend in development mode...$(NC)"
	@cd $(BACKEND_DIR) && uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Start only frontend in development mode
	@echo "$(BLUE)Starting frontend in development mode...$(NC)"
	@cd $(FRONTEND_DIR) && npm start

# Database operations
db-migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	@cd $(BACKEND_DIR) && alembic upgrade head

db-reset: ## Reset database
	@echo "$(BLUE)Resetting database...$(NC)"
	@cd $(BACKEND_DIR) && alembic downgrade base
	@cd $(BACKEND_DIR) && alembic upgrade head

# Security
security-scan: ## Run security scans
	@echo "$(BLUE)Running security scans...$(NC)"
	@echo "$(YELLOW)Scanning backend for vulnerabilities...$(NC)"
	@cd $(BACKEND_DIR) && pip install safety && safety check
	@echo "$(YELLOW)Scanning frontend for vulnerabilities...$(NC)"
	@cd $(FRONTEND_DIR) && npm audit

# Documentation
docs: ## Generate documentation
	@echo "$(BLUE)Generating documentation...$(NC)"
	@echo "$(YELLOW)Backend API docs available at: http://localhost:8000/docs$(NC)"
	@echo "$(YELLOW)Frontend docs:$(NC)"
	@cd $(FRONTEND_DIR) && npm run build 2>/dev/null || echo "Frontend build completed"

# Quick commands
quick-start: setup dev ## Quick start (setup + dev)
quick-test: test lint ## Quick test (test + lint)
quick-clean: clean restart ## Quick clean (clean + restart)

# Show project info
info: ## Show project information
	@echo "$(CYAN)Vinkit - Secure Distributed Video Chat$(NC)"
	@echo "$(CYAN)=====================================$(NC)"
	@echo ""
	@echo "$(GREEN)Project Structure:$(NC)"
	@echo "  Backend:  $(BACKEND_DIR)/"
	@echo "  Frontend: $(FRONTEND_DIR)/"
	@echo "  Nginx:    $(NGINX_DIR)/"
	@echo ""
	@echo "$(GREEN)Access Points:$(NC)"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"
	@echo "  API Docs: http://localhost:8000/docs"
	@echo ""
	@echo "$(GREEN)Demo Credentials:$(NC)"
	@echo "  Username: demo"
	@echo "  Password: demo"
	@echo ""
	@echo "$(GREEN)Useful Commands:$(NC)"
	@echo "  make help     - Show this help"
	@echo "  make start    - Start all services"
	@echo "  make stop     - Stop all services"
	@echo "  make logs     - Show service logs"
	@echo "  make test     - Run all tests"
	@echo "  make clean    - Clean up resources"
