from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints import text_blocks, upload

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(text_blocks.router, prefix="/api", tags=["text-blocks"])
app.include_router(upload.router, prefix="/api", tags=["upload"])

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
