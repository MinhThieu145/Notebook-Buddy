from fastapi import APIRouter, HTTPException
from ..services.pdf_service import extract_text_from_pdf
from ..services.openai_service import generate_text_blocks
from typing import Dict
from pydantic import BaseModel

class TextBlockRequest(BaseModel):
    file_path: str

router = APIRouter()

@router.post("/generate-text-blocks")
async def create_text_blocks(request: TextBlockRequest) -> Dict:
    """
    Generate structured text blocks from a PDF file.
    
    Args:
        request (TextBlockRequest): Request body containing the PDF file path.
        
    Returns:
        dict: A dictionary containing the generated text blocks.
        
    Raises:
        HTTPException: If the file is not found or is not a PDF.
    """
    if not request.file_path.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Extract text from PDF
    pdf_text = await extract_text_from_pdf(request.file_path)
    
    # Generate text blocks
    text_blocks = await generate_text_blocks(pdf_text)
    
    return {
        "status": "success",
        "data": text_blocks
    }
