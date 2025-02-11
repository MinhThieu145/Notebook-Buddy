import fitz  # PyMuPDF
from fastapi import HTTPException
import os

async def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text content from a PDF file.
    
    Args:
        file_path (str): Path to the PDF file.
        
    Returns:
        str: Extracted text content from the PDF.
        
    Raises:
        HTTPException: If there's an error processing the PDF.
    """
    try:
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"PDF file not found at: {file_path}")
            
        # Extract text from the PDF
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text("text") + "\n\n"
        
        # Clean up
        doc.close()
        
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")
