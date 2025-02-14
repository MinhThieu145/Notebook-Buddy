from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from dotenv import load_dotenv
import os
import logging

# Load environment variables at startup
env_path = Path(__file__).resolve().parent / '.env'
print(f"Loading .env from: {env_path}")  # Debug print
load_dotenv(dotenv_path=env_path)

# Print AWS credentials for debugging
print("\nAWS Credentials loaded:")
print(f"AWS_ACCESS_KEY_ID: {'*' * len(os.getenv('AWS_ACCESS_KEY_ID', ''))} (length: {len(os.getenv('AWS_ACCESS_KEY_ID', ''))})")
print(f"AWS_SECRET_ACCESS_KEY: {'*' * len(os.getenv('AWS_SECRET_ACCESS_KEY', ''))} (length: {len(os.getenv('AWS_SECRET_ACCESS_KEY', ''))})")
print(f"AWS_REGION: {os.getenv('AWS_REGION', 'us-east-1')}")

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

logger.info("Starting Notebook Buddy API server")

# Import routers after environment variables are loaded
from api.endpoints import auth, projects, assistants, text_blocks, upload, vector_stores

# Include routers
app.include_router(auth.router, tags=["auth"])
app.include_router(projects.router, tags=["projects"])
app.include_router(assistants.router, tags=["assistants"])
app.include_router(text_blocks.router, tags=["text-blocks"])
app.include_router(upload.router, tags=["upload"])
app.include_router(vector_stores.router, tags=["vector-stores"])

logger.info("All routers configured successfully")

@app.get("/")
async def root():
    return {"message": "Welcome to Notebook Buddy API"}

@app.get("/test")
async def test_endpoint():
    """Test endpoint to verify server is running"""
    return {
        "status": "success",
        "message": "Server is running",
        "environment": {
            "AWS_REGION": os.getenv("AWS_REGION", "not set"),
            "API_URL": os.getenv("API_URL", "not set")
        }
    }
