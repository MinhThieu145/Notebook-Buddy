import os
import time
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_file(file: UploadFile = File(..., max_size=10 * 1024 * 1024)) -> Dict:  # 10MB limit
    """
    Handle file upload and save to temporary location.
    
    Args:
        file (UploadFile): The uploaded file (max size 10MB).
        
    Returns:
        Dict: A dictionary containing the file path.
        
    Raises:
        HTTPException: If file is too large or invalid.
    """
    try:
        # Validate file type
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Create a unique filename
        timestamp = int(time.time())
        safe_filename = "".join(c for c in file.filename if c.isalnum() or c in ('-', '_')).rstrip()
        filename = f"{safe_filename}_{timestamp}.pdf"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # Save the uploaded file in chunks to handle large files
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(8192):  # 8KB chunks
                buffer.write(chunk)
        
        return {
            "status": "success",
            "filePath": file_path
        }
        
    except Exception as e:
        # Clean up any partially uploaded file
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
            
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")
