# Vinkit - Secure Distributed Video Chat

A modern, secure, and distributed video chat application built with Python FastAPI backend and advanced React frontend. Features end-to-end encryption, WebRTC peer-to-peer connections, and scalable distributed architecture.

## 🚀 Features

### Security & Privacy
- **End-to-End Encryption**: All communications are encrypted using WebRTC's built-in encryption
- **JWT Authentication**: Secure token-based authentication system
- **No Data Storage**: Peer-to-peer connections mean no video/audio data passes through servers
- **Secure Signaling**: WebSocket signaling with authentication

### Advanced Video Chat
- **WebRTC Technology**: Low-latency, high-quality video and audio
- **Screen Sharing**: Share your screen with participants
- **Multi-User Support**: Connect with multiple participants simultaneously
- **Adaptive UI**: Responsive grid layout that adapts to participant count
- **Real-time Controls**: Mute, video toggle, and call management

### Modern UI/UX
- **Glass Morphism Design**: Beautiful, modern interface with glass effects
- **Dark Theme**: Eye-friendly dark theme with gradient accents
- **Smooth Animations**: Framer Motion animations for fluid interactions
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Real-time Chat**: Built-in text chat during video calls

### Distributed Architecture
- **Redis Backend**: Distributed signaling server with Redis
- **Docker Support**: Easy deployment with Docker Compose
- **Nginx Load Balancing**: Production-ready reverse proxy
- **Scalable Design**: Can handle multiple server instances
- **Health Checks**: Built-in health monitoring

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  FastAPI Backend │    │  Redis Cache    │
│                 │    │                 │    │                 │
│ • WebRTC Client │◄──►│ • WebSocket API │◄──►│ • Session Store │
│ • Video/Audio   │    │ • JWT Auth      │    │ • Room Data     │
│ • Screen Share  │    │ • Signaling     │    │ • Distributed   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Nginx Proxy    │
                    │                 │
                    │ • Load Balancer  │
                    │ • SSL Termination│
                    │ • Rate Limiting  │
                    └─────────────────┘
```

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **WebSockets**: Real-time bidirectional communication
- **Redis**: Distributed caching and session storage
- **JWT**: Secure authentication tokens
- **Uvicorn**: ASGI server for production

### Frontend
- **React 18**: Latest React with hooks and concurrent features
- **TypeScript**: Type-safe JavaScript development
- **Material-UI**: Modern component library
- **Framer Motion**: Smooth animations and transitions
- **WebRTC**: Peer-to-peer video/audio communication
- **Zustand**: Lightweight state management

### Infrastructure
- **Docker**: Containerized deployment
- **Nginx**: Reverse proxy and load balancer
- **Redis**: Distributed cache and session store

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Using Makefile (Recommended)

The project includes a comprehensive Makefile with all common tasks:

```bash
# Quick setup and start
make quick-start

# Or step by step:
make setup      # Initial project setup
make start      # Start all services
make logs       # View service logs
make test       # Run all tests
make clean      # Clean up resources
```

### Using Docker (Alternative)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vinkit
   ```

2. **Start the application**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Local Development

1. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp env.example .env
   # Edit .env with your configuration
   uvicorn main:app --reload
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm start
   ```

3. **Redis Setup**
   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```

## 📖 Usage

### Getting Started
1. **Login**: Use demo credentials (demo/demo) or create your own
2. **Create Room**: Click "Create Room" to start a new video chat
3. **Join Room**: Enter a room ID to join an existing chat
4. **Invite Others**: Share the room ID with others to invite them

### Video Chat Features
- **Camera/Microphone**: Toggle your camera and microphone
- **Screen Sharing**: Share your screen with participants
- **Chat**: Send text messages during the call
- **Fullscreen**: Toggle fullscreen mode for better viewing
- **Settings**: Configure audio/video quality and preferences

### Security Features
- **Encrypted Communication**: All video/audio is encrypted end-to-end
- **Secure Signaling**: WebSocket connections are authenticated
- **No Data Storage**: No video/audio data is stored on servers
- **Token Authentication**: JWT tokens for secure access

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
SECRET_KEY=your-super-secret-key-change-in-production
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:password@localhost:5432/vinkit
```

#### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
```

### Production Configuration

1. **SSL Certificates**: Place your SSL certificates in `nginx/ssl/`
2. **Environment Variables**: Update all environment variables for production
3. **Domain Configuration**: Update nginx configuration with your domain
4. **Security**: Change all default passwords and secret keys

## 🚀 Deployment

### Docker Deployment
```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
1. **Server Setup**: Configure your server with Docker
2. **SSL Certificates**: Obtain and configure SSL certificates
3. **Domain Configuration**: Update DNS and nginx configuration
4. **Monitoring**: Set up monitoring and logging

### Scaling
- **Multiple Backend Instances**: Run multiple backend containers
- **Redis Cluster**: Configure Redis for high availability
- **Load Balancing**: Use nginx for load balancing
- **CDN**: Use a CDN for static assets

## 🔒 Security Considerations

### Production Security
- **Change Default Credentials**: Update all default passwords
- **SSL/TLS**: Use HTTPS in production
- **Firewall**: Configure proper firewall rules
- **Rate Limiting**: Implement rate limiting for API endpoints
- **Monitoring**: Set up security monitoring and logging

### Data Privacy
- **No Data Storage**: Video/audio data is not stored
- **Encrypted Communication**: All data is encrypted in transit
- **Secure Signaling**: Signaling data is authenticated
- **Token Expiration**: JWT tokens have expiration times

## 🧪 Development

### Using Makefile (Recommended)

The Makefile provides all development commands:

```bash
# Development workflow
make dev              # Start development environment
make test            # Run all tests
make test-backend    # Run backend tests only
make test-frontend   # Run frontend tests only
make lint            # Run linting
make format          # Format code
make clean           # Clean up resources
```

### Manual Commands

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Quality
```bash
# Backend linting
cd backend
flake8 .
black .

# Frontend linting
cd frontend
npm run lint
npm run format
```

## 📚 API Documentation

### Authentication
- `POST /auth/login` - User login
- `GET /rooms/{room_id}` - Get room information
- `POST /rooms/create` - Create new room

### WebSocket Events
- `join_room` - Join a video chat room
- `webrtc_offer` - WebRTC offer signaling
- `webrtc_answer` - WebRTC answer signaling
- `ice_candidate` - ICE candidate exchange
- `leave_room` - Leave the room

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API documentation at `/docs`

## 🛠️ Makefile Commands

The project includes a comprehensive Makefile with over 30 commands:

### Quick Commands
```bash
make help          # Show all available commands
make quick-start   # Setup and start (setup + start)
make quick-test    # Test and lint (test + lint)
make quick-clean   # Clean and restart (clean + restart)
```

### Development
```bash
make setup         # Initial project setup
make install       # Install dependencies
make dev           # Start development environment
make dev-backend   # Start backend only
make dev-frontend  # Start frontend only
```

### Services
```bash
make start         # Start all services
make stop          # Stop all services
make restart       # Restart all services
make status        # Show service status
make health        # Check service health
```

### Testing & Quality
```bash
make test          # Run all tests
make test-backend  # Run backend tests
make test-frontend # Run frontend tests
make lint          # Run linting
make format        # Format code
```

### Logs & Monitoring
```bash
make logs          # Show all logs
make logs-backend  # Show backend logs
make logs-frontend # Show frontend logs
make logs-nginx    # Show nginx logs
make logs-redis    # Show redis logs
make monitor       # Monitor system resources
```

### Cleanup
```bash
make clean         # Clean containers and images
make clean-all     # Deep clean everything
make reset         # Reset to clean state
```

### Production
```bash
make build         # Build Docker images
make deploy        # Deploy to production
make backup        # Create backup
make update        # Update dependencies
```

### Shell Access
```bash
make shell-backend # Backend container shell
make shell-frontend # Frontend container shell
make shell-redis   # Redis CLI
```

## 🔮 Roadmap

- [ ] Mobile app support
- [ ] Advanced screen sharing options
- [ ] Recording capabilities
- [ ] Advanced security features
- [ ] Performance optimizations
- [ ] Internationalization
- [ ] Advanced analytics