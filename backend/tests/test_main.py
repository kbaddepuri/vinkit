import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Secure Video Chat API", "status": "running"}

def test_login_success():
    response = client.post("/auth/login", data={"username": "demo", "password": "demo"})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_failure():
    response = client.post("/auth/login", data={"username": "demo", "password": "wrong"})
    assert response.status_code == 401

def test_create_room():
    # First login to get token
    login_response = client.post("/auth/login", data={"username": "demo", "password": "demo"})
    token = login_response.json()["access_token"]
    
    # Create room with token
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/rooms/create", headers=headers)
    assert response.status_code == 200
    assert "room_id" in response.json()
