from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.auth_service import AuthService
import uuid

router = APIRouter()
auth_service = AuthService()

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(user: UserCreate):
    """Register a new user"""
    existing_user = auth_service.get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        new_user = auth_service.create_user(user.email, user.password)
        return {
            "status": "success",
            "data": new_user
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
def login(user: UserLogin):
    """Authenticate a user"""
    try:
        authenticated_user = auth_service.authenticate_user(user.email, user.password)
        if not authenticated_user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Get demo status
        is_demo = auth_service.get_user_demo_flag(user.email)
        
        # Return user data in the expected format
        return {
            "status": "success",
            "data": {
                "id": authenticated_user.get("pk", "").replace("USER#", ""),
                "email": authenticated_user.get("email"),
                "is_demo": is_demo
            }
        }
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/create-demo-user")
def create_demo_user():
    """Create a demo user with temporary credentials"""
    try:
        # Generate a random demo email
        demo_id = str(uuid.uuid4())[:8]
        demo_email = f"demo_{demo_id}@demo.com"
        demo_password = str(uuid.uuid4())
        
        print(f"Creating demo user with email: {demo_email}")

        # Check if demo user already exists
        existing_user = auth_service.get_user_by_email(demo_email)
        if existing_user:
            print(f"Demo user already exists: {demo_email}")
            raise HTTPException(status_code=400, detail="Demo user already exists")

        # Create demo user
        print(f"Attempting to create demo user in database...")
        demo_user = auth_service.create_user(demo_email, demo_password)
        print(f"Demo user created successfully: {demo_user}")
        
        # Add demo flag to user data
        print(f"Setting demo flag for user: {demo_email}")
        auth_service.update_user_demo_flag(demo_email, True)
        print(f"Demo flag set successfully")
        
        # Return credentials that can be used for login
        response_data = {
            "status": "success",
            "data": {
                "id": demo_user["id"],
                "email": demo_email,
                "password": demo_password,
                "is_demo": True
            }
        }
        print(f"Returning demo user data: {response_data}")
        return response_data
    except Exception as e:
        print(f"Error creating demo user: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to create demo user: {str(e)}")
