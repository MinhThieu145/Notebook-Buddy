from fastapi import APIRouter, HTTPException, Body, Depends
from typing import Dict, Optional, List, Any
from pydantic import BaseModel

from ..services.openai_service import OpenAIService
from ..services.anthropic_service import AnthropicService

router = APIRouter(prefix="/llm")
openai_service = OpenAIService()
anthropic_service = AnthropicService()

class Message(BaseModel):
    role: str
    content: str

class GPTChatRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = None
    top_p: Optional[float] = None
    stream: Optional[bool] = False
    system_message: Optional[str] = None

class ClaudeMessageRequest(BaseModel):
    messages: List[Message]
    system: Optional[str] = None
    max_tokens: Optional[int] = None
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

@router.post("/gpt/chat")
async def chat_with_gpt(request: GPTChatRequest) -> Dict:
    """
    Send a chat completion request to OpenAI's GPT models.
    
    Args:
        request (GPTChatRequest): The chat request containing messages and optional parameters
        
    Returns:
        dict: GPT's response
    """
    try:
        response = await openai_service.create_chat_completion(
            messages=[{"role": msg.role, "content": msg.content} for msg in request.messages],
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            top_p=request.top_p,
            stream=request.stream,
            system_message=request.system_message
        )
        return response
        
    except Exception as e:
        print(f"Error in chat_with_gpt: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error communicating with GPT: {str(e)}"
        )

@router.post("/claude/message")
async def message_with_claude(request: ClaudeMessageRequest) -> Dict:
    """
    Send a message request to Anthropic's Claude model.
    
    Args:
        request (ClaudeMessageRequest): The message request containing messages and optional parameters
        
    Returns:
        dict: Claude's response
    """
    try:
        response = anthropic_service.create_message(
            messages=[{"role": msg.role, "content": msg.content} for msg in request.messages],
            system=request.system,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            top_p=request.top_p,
            metadata=request.metadata
        )
        return response
        
    except Exception as e:
        print(f"Error in message_with_claude: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error communicating with Claude: {str(e)}"
        )
