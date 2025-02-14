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
from api.endpoints import text_blocks, upload, users, vector_stores, auth, assistants, projects

# Include routers
app.include_router(auth.router, tags=["auth"])
app.include_router(text_blocks.router, tags=["text-blocks"])
app.include_router(upload.router, tags=["upload"])
app.include_router(users.router, tags=["users"])
app.include_router(vector_stores.router, tags=["vector-stores"])
app.include_router(assistants.router, tags=["assistants"])
app.include_router(projects.router, tags=["projects"])

logger.info("All routers configured successfully")

@app.get("/")
async def root():
    return {"message": "Welcome to the Notebook Buddy API"}

@app.get("/test")
async def test_endpoint():
    return {
        "status": "success",
        "message": "Test endpoint is working correctly",
        "data": {
            "timestamp": "2025-02-10T23:29:37-05:00"
        }
    }
