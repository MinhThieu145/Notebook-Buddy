from typing import Dict, List, Optional, Any
import openai
import json
from fastapi import HTTPException
from ..config.settings import settings

# Initialize OpenAI client
client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

class OpenAIService:
    def __init__(self):
        self.client = client
        self.default_model = settings.MODEL_NAME

    async def create_chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        top_p: Optional[float] = None,
        stream: Optional[bool] = False,
        system_message: Optional[str] = None,
    ) -> Dict:
        """
        Create a chat completion using OpenAI's API.
        
        Args:
            messages: List of message objects with role and content
            model: Optional model to use (defaults to settings.MODEL_NAME)
            temperature: Optional temperature parameter
            max_tokens: Optional maximum number of tokens to generate
            top_p: Optional top_p parameter
            stream: Optional streaming parameter
            system_message: Optional system message to prepend
            
        Returns:
            Dict: The API response containing the generated message
        """
        try:
            # Build parameters dictionary
            params = {
                "model": model or self.default_model,
                "messages": messages,
            }
            
            # Add system message if provided
            if system_message:
                params["messages"] = [{"role": "system", "content": system_message}] + params["messages"]
                
            # Add optional parameters if provided
            if temperature is not None:
                params["temperature"] = temperature
            if max_tokens is not None:
                params["max_tokens"] = max_tokens
            if top_p is not None:
                params["top_p"] = top_p
            if stream is not None:
                params["stream"] = stream

            # Make API call
            response = self.client.chat.completions.create(**params)
            
            # Return formatted response
            return {
                "content": response.choices[0].message.content,
                "model": response.model,
                "role": response.choices[0].message.role,
            }
            
        except Exception as e:
            print(f"Error in create_chat_completion: {str(e)}")
            raise Exception(f"Error creating chat completion: {str(e)}")

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
