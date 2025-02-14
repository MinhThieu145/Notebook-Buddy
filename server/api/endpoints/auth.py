from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from ..services.auth_service import AuthService
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth")  # Add prefix to match client requests
auth_service = AuthService()

class UserCreate(BaseModel):
    email: str
    password: str | None = None
    name: str | None = None
    provider: str | None = None
    providerId: str | None = None

class UserLogin(BaseModel):
    email: str
    password: str

@router.post("/create-user")
async def create_user(request: Request, user: UserCreate):
    """Create a new user (supports both email/password and OAuth)"""
    try:
        # Log the incoming request
        body = await request.json()
        logger.info(f"Received create-user request with body: {body}")
        
        existing_user = auth_service.get_user_by_email(user.email)
        logger.info(f"Existing user check result: {existing_user}")
        
        if existing_user:
            # If user exists and uses the same provider, return success
            if existing_user.get("provider") == user.provider:
                logger.info(f"User exists with same provider: {user.email}")
                return {
                    "status": "success",
                    "data": {
                        "id": existing_user.get("pk", "").replace("USER#", ""),
                        "email": existing_user.get("email"),
                        "name": existing_user.get("name"),
                        "provider": existing_user.get("provider")
                    }
                }
            logger.warning(f"User exists with different provider: {user.email}")
            raise HTTPException(status_code=400, detail="Email already registered with different provider")

        # Create new user
        logger.info(f"Creating new user: {user.email}")
        new_user = auth_service.create_user(
            email=user.email,
            password=user.password,
            name=user.name,
            provider=user.provider,
            provider_id=user.providerId
        )
        
        logger.info(f"User created successfully: {user.email}")
        return {
            "status": "success",
            "data": new_user
        }
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/register")
def register(request: Request, user: UserCreate):
    """Register a new user"""
    try:
        # Log the incoming request
        body = request.json()
        logger.info(f"Received register request with body: {body}")
        
        existing_user = auth_service.get_user_by_email(user.email)
        logger.info(f"Existing user check result: {existing_user}")
        
        if existing_user:
            logger.warning(f"User exists: {user.email}")
            raise HTTPException(status_code=400, detail="Email already registered")
        
        logger.info(f"Registering new user: {user.email}")
        try:
            new_user = auth_service.create_user(user.email, user.password)
            logger.info(f"User registered successfully: {user.email}")
            return {
                "status": "success",
                "data": new_user
            }
        except Exception as e:
            logger.error(f"Error registering user: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error registering user: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
def login(request: Request, user: UserLogin):
    """Authenticate a user"""
    try:
        # Log the incoming request
        body = request.json()
        logger.info(f"Received login request with body: {body}")
        
        try:
            authenticated_user = auth_service.authenticate_user(user.email, user.password)
            logger.info(f"User authentication result: {authenticated_user}")
            
            if not authenticated_user:
                logger.warning(f"Invalid credentials: {user.email}")
                raise HTTPException(status_code=401, detail="Invalid credentials")
            
            # Get demo status
            is_demo = auth_service.get_user_demo_flag(user.email)
            logger.info(f"Demo status for user: {user.email}, is_demo: {is_demo}")
            
            # Return user data in the expected format
            return {
                "status": "success",
                "data": {
                    "id": authenticated_user.get("pk", "").replace("USER#", ""),
                    "email": authenticated_user.get("email"),
                    "is_demo": is_demo,
                    "provider": authenticated_user.get("provider", "credentials")
                }
            }
        except Exception as e:
            logger.error(f"Error authenticating user: {str(e)}", exc_info=True)
            raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        logger.error(f"Error authenticating user: {str(e)}", exc_info=True)
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/create-demo-user")
def create_demo_user(request: Request):
    """Create a demo user with temporary credentials"""
    try:
        # Log the incoming request
        logger.info(f"Received create-demo-user request")
        
        # Generate a random demo email
        demo_id = str(uuid.uuid4())[:8]
        demo_email = f"demo_{demo_id}@demo.com"
        demo_password = str(uuid.uuid4())
        
        logger.info(f"Creating demo user with email: {demo_email}")

        # Check if demo user already exists
        existing_user = auth_service.get_user_by_email(demo_email)
        logger.info(f"Existing demo user check result: {existing_user}")
        
        if existing_user:
            logger.warning(f"Demo user already exists: {demo_email}")
            raise HTTPException(status_code=400, detail="Demo user already exists")

        # Create demo user
        logger.info(f"Creating demo user in database...")
        try:
            demo_user = auth_service.create_user(demo_email, demo_password)
            logger.info(f"Demo user created successfully: {demo_user}")
        except Exception as e:
            logger.error(f"Error creating demo user: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))
        
        # Add demo flag to user data
        logger.info(f"Setting demo flag for user: {demo_email}")
        try:
            auth_service.update_user_demo_flag(demo_email, True)
            logger.info(f"Demo flag set successfully")
        except Exception as e:
            logger.error(f"Error setting demo flag: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))
        
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
        logger.info(f"Returning demo user data: {response_data}")
        return response_data
    except Exception as e:
        logger.error(f"Error creating demo user: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
