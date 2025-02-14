from typing import Dict
import openai
import json
from fastapi import HTTPException
from ..config.settings import settings

# Initialize OpenAI client
client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

async def generate_text_blocks(pdf_text: str) -> Dict:
    """
    Generate structured text blocks from PDF text using OpenAI API.
    
    Args:
        pdf_text (str): The text content extracted from the PDF.
        
    Returns:
        Dict: Structured text blocks with titles and content.
        
    Raises:
        HTTPException: If there's an error generating text blocks.
    """
    system_message = """
    You are an AI that simplifies complex documents into easy-to-understand, no-brainer guides. Your goal is to extract only the most essential information and present it in a clear, structured format using Markdown.

    Each section should:

    Have a clear and concise title (#, ##, ###).
    Use short, simple sentences that are easy to grasp.
    Avoid unnecessary details—only include what truly matters.
    Follow a logical order for natural flow.
    Be engaging and effortless to read.
    """

    user_message = f"""
    Here’s a document that needs to be turned into a simple, no-brainer guide.

    Instructions:
    Extract only key points—make it as clear and effortless as possible.
    Use Markdown for structure (#, ##, ###).
    Avoid technical jargon—write as if explaining to a 10-year-old.
    Keep each section short, punchy, and straight to the point.
    Document Content:
    {pdf_text}
    """

    json_schema = {
        "name": "text_blocks",
        "schema": {
            "type": "object",
            "properties": {
                "blocks": {
                    "description": "A list of structured text blocks with titles and content in Markdown format.",
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {
                                "description": "The title in Markdown format (#, ##, ###)",
                                "type": "string"
                            },
                            "content": {
                                "description": "The corresponding content in Markdown format",
                                "type": "string"
                            }
                        },
                        "required": ["title", "content"]
                    }
                }
            },
            "required": ["blocks"]
        }
    }

    try:
        response = client.chat.completions.create(
            model=settings.MODEL_NAME,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            response_format={
                "type": "json_schema",
                "json_schema": json_schema
            }
        )
        
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating text blocks: {str(e)}")
