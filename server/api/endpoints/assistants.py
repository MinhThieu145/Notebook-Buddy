from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict, Union
from ..services.assistant_service import AssistantService

router = APIRouter()
assistant_service = AssistantService()

@router.post("/create_assistant")
async def create_assistant(
    model: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    instructions: Optional[str] = None,
    tools: Optional[List[Dict]] = None,
    tool_resources: Optional[Dict] = None,
    metadata: Optional[Dict] = None,
    temperature: Optional[float] = None,
    top_p: Optional[float] = None,
    response_format: Optional[Union[str, Dict]] = None,
    reasoning_effort: Optional[str] = None
):
    """
    Create a new OpenAI assistant
    Args:
        model (str): ID of the model to use
        name (Optional[str]): Name of the assistant
        description (Optional[str]): Description of the assistant
        instructions (Optional[str]): System instructions for the assistant
        tools (Optional[List[Dict]]): List of tools enabled for the assistant
        tool_resources (Optional[Dict]): Resources used by assistant's tools
        metadata (Optional[Dict]): Additional key-value pairs
        temperature (Optional[float]): Sampling temperature (0-2)
        top_p (Optional[float]): Nucleus sampling parameter
        response_format (Optional[Union[str, Dict]]): Output format specification
        reasoning_effort (Optional[str]): Effort level for reasoning models
    Returns:
        dict: The created assistant object
    """
    try:
        assistant = await assistant_service.create_assistant(
            model=model,
            name=name,
            description=description,
            instructions=instructions,
            tools=tools,
            tool_resources=tool_resources,
            metadata=metadata,
            temperature=temperature,
            top_p=top_p,
            response_format=response_format,
            reasoning_effort=reasoning_effort
        )
        return {
            "status": "success",
            "data": assistant
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list_assistants")
async def list_assistants(
    limit: Optional[int] = None,
    order: Optional[str] = None
):
    """
    List all assistants
    Args:
        limit (Optional[int]): Maximum number of assistants to return
        order (Optional[str]): Sort order ('asc' or 'desc')
    Returns:
        dict: List of assistant objects
    """
    try:
        assistants = await assistant_service.list_assistants(limit=limit, order=order)
        return {
            "status": "success",
            "data": assistants
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/get_assistant/{assistant_id}")
async def get_assistant(assistant_id: str):
    """
    Retrieve a specific assistant
    Args:
        assistant_id (str): ID of the assistant to retrieve
    Returns:
        dict: Assistant object
    """
    try:
        assistant = await assistant_service.get_assistant(assistant_id)
        return {
            "status": "success",
            "data": assistant
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
