from sqlalchemy.orm import Session
from passlib.context import CryptContext
from models import User
from typing import Optional
import re
import hashlib

# Password hashing with bcrypt
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__default_rounds=12
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    # First try direct verification
    if pwd_context.verify(plain_password, hashed_password):
        return True
    
    # If that fails and password is long, try with SHA256 hash
    if len(plain_password.encode('utf-8')) > 72:
        password_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
        return pwd_context.verify(password_hash, hashed_password)
    
    return False

def get_password_hash(password: str) -> str:
    """Hash a password with bcrypt."""
    # Truncate password to 72 bytes if necessary (bcrypt limit)
    if len(password.encode('utf-8')) > 72:
        # Hash the password first to get a consistent 32-byte hash, then use that
        password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
        return pwd_context.hash(password_hash)
    return pwd_context.hash(password)

def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_username(username: str) -> bool:
    """Validate username format."""
    # Username should be 3-20 characters, alphanumeric and underscores only
    pattern = r'^[a-zA-Z0-9_]{3,20}$'
    return re.match(pattern, username) is not None

def validate_password(password: str) -> bool:
    """Validate password strength."""
    # Password should be at least 8 characters and not too long
    return len(password) >= 8 and len(password) <= 100

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username."""
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email."""
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID."""
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, username: str, email: str, password: str) -> User:
    """Create a new user."""
    hashed_password = get_password_hash(password)
    db_user = User(
        username=username,
        email=email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate a user."""
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
