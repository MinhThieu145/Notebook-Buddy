from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the Notebook Buddy API"}

def test_test_endpoint():
    response = client.get("/test")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["message"] == "Test endpoint is working correctly"
    assert "timestamp" in data["data"]
