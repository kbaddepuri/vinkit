from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import redis.asyncio as redis
import json
import uuid
import jwt
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db, engine
from models import Base
from user_service import authenticate_user, create_user, get_user_by_username, validate_username, validate_email, validate_password
from schemas import UserCreate, UserResponse, LoginRequest, Token

load_dotenv()

# Environment variables
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# Create database tables
Base.metadata.create_all(bind=engine)

# Redis connection for distributed architecture
redis_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client
    try:
        redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
        # Test Redis connection
        await redis_client.ping()
    except Exception as e:
        print(f"Warning: Redis connection failed: {e}")
        print("Running without Redis - some features may be limited")
        redis_client = None
    yield
    if redis_client:
        await redis_client.close()

app = FastAPI(
    title="Secure Video Chat API",
    description="Distributed secure video chat backend with WebRTC signaling",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Active connections for WebSocket management
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.room_connections: Dict[str, List[str]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        # Remove from all rooms
        for room_id, users in self.room_connections.items():
            if user_id in users:
                users.remove(user_id)

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(json.dumps(message))

    async def join_room(self, user_id: str, room_id: str):
        if room_id not in self.room_connections:
            self.room_connections[room_id] = []
        if user_id not in self.room_connections[room_id]:
            self.room_connections[room_id].append(user_id)

    async def leave_room(self, user_id: str, room_id: str):
        if room_id in self.room_connections and user_id in self.room_connections[room_id]:
            self.room_connections[room_id].remove(user_id)

    async def broadcast_to_room(self, message: dict, room_id: str, exclude_user: str = None):
        if room_id in self.room_connections:
            for user_id in self.room_connections[room_id]:
                if user_id != exclude_user and user_id in self.active_connections:
                    await self.active_connections[user_id].send_text(json.dumps(message))

manager = ConnectionManager()

# JWT token functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# API Routes
@app.get("/")
async def root():
    return {"message": "Secure Video Chat API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Validate input
    if not validate_username(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be 3-20 characters, alphanumeric and underscores only"
        )
    
    if not validate_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    
    if not validate_password(user_data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Check if user already exists
    if get_user_by_username(db, user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    from user_service import get_user_by_email
    if get_user_by_email(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = create_user(db, user_data.username, user_data.email, user_data.password)
    return user

@app.post("/auth/login", response_model=Token)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users", response_model=List[UserResponse])
async def get_users(db: Session = Depends(get_db), current_user: str = Depends(verify_token)):
    """Get all users (admin only for now)"""
    users = db.query(User).filter(User.is_active == True).all()
    return users

@app.get("/users/me", response_model=UserResponse)
async def get_current_user(db: Session = Depends(get_db), current_user: str = Depends(verify_token)):
    """Get current user profile"""
    user = get_user_by_username(db, current_user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/rooms/create")
async def create_room(user_id: str = Depends(verify_token)):
    room_id = str(uuid.uuid4())
    # Store room in Redis for distributed access (if available)
    if redis_client:
        try:
            await redis_client.setex(f"room:{room_id}", 3600, json.dumps({
                "id": room_id,
                "created_by": user_id,
                "created_at": datetime.utcnow().isoformat(),
                "participants": []
            }))
        except Exception as e:
            print(f"Warning: Failed to store room in Redis: {e}")
    return {"room_id": room_id}

@app.get("/rooms/{room_id}")
async def get_room(room_id: str, user_id: str = Depends(verify_token)):
    if redis_client:
        try:
            room_data = await redis_client.get(f"room:{room_id}")
            if not room_data:
                raise HTTPException(status_code=404, detail="Room not found")
            return json.loads(room_data)
        except Exception as e:
            print(f"Warning: Failed to get room from Redis: {e}")
            # Return basic room info if Redis is not available
            return {"id": room_id, "created_by": "unknown", "participants": []}
    else:
        # Return basic room info if Redis is not available
        return {"id": room_id, "created_by": "unknown", "participants": []}

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "join_room":
                room_id = message["room_id"]
                await manager.join_room(user_id, room_id)
                
                # Notify other participants
                await manager.broadcast_to_room({
                    "type": "user_joined",
                    "user_id": user_id,
                    "room_id": room_id
                }, room_id, exclude_user=user_id)
                
                # Send current participants to the new user
                if room_id in manager.room_connections:
                    participants = [uid for uid in manager.room_connections[room_id] if uid != user_id]
                    await manager.send_personal_message({
                        "type": "participants",
                        "participants": participants
                    }, user_id)
            
            elif message["type"] == "webrtc_offer":
                # Forward WebRTC offer to target user
                target_user = message["target_user"]
                await manager.send_personal_message({
                    "type": "webrtc_offer",
                    "offer": message["offer"],
                    "from_user": user_id
                }, target_user)
            
            elif message["type"] == "webrtc_answer":
                # Forward WebRTC answer to target user
                target_user = message["target_user"]
                await manager.send_personal_message({
                    "type": "webrtc_answer",
                    "answer": message["answer"],
                    "from_user": user_id
                }, target_user)
            
            elif message["type"] == "ice_candidate":
                # Forward ICE candidate to target user
                target_user = message["target_user"]
                await manager.send_personal_message({
                    "type": "ice_candidate",
                    "candidate": message["candidate"],
                    "from_user": user_id
                }, target_user)
            
            elif message["type"] == "leave_room":
                room_id = message["room_id"]
                await manager.leave_room(user_id, room_id)
                await manager.broadcast_to_room({
                    "type": "user_left",
                    "user_id": user_id,
                    "room_id": room_id
                }, room_id)
    
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        # Notify all rooms that user left
        for room_id, users in manager.room_connections.items():
            if user_id in users:
                await manager.broadcast_to_room({
                    "type": "user_left",
                    "user_id": user_id,
                    "room_id": room_id
                }, room_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
