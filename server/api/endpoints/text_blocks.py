from fastapi import APIRouter, HTTPException, Request, Body
from ..services.dynamodb_service import DynamoDBService
from typing import Dict, Any, List
import logging
import json
from pydantic import BaseModel
from typing import List, Optional

# Configure logging
logger = logging.getLogger(__name__)

# Pydantic models for request validation
class TextBlock(BaseModel):
    id: int  # Changed to int to match frontend
    content: str
    order: int  # Add order field to track block position

class TextBlockBatch(BaseModel):
    projectId: str
    blocks: List[TextBlock]

class BlocksPayload(BaseModel):
    blocks: List[TextBlock]

router = APIRouter(prefix="/text-blocks")
dynamodb_service = DynamoDBService()

@router.get("/{project_id}")
async def get_text_blocks(project_id: str):
    """
    Get all text blocks for a specific project
    Args:
        project_id (str): ID of the project whose text blocks to retrieve
    Returns:
        dict: List of text blocks
    """
    try:
        logger.info(f"Fetching text blocks for project: {project_id}")
        blocks = dynamodb_service.get_text_blocks(project_id)
        
        # Transform the blocks to match client expectations
        transformed_blocks = [{
            'id': block['textBlockId'],
            'content': block['content'],
            'position': block.get('position', {'x': 0, 'y': 0})
        } for block in blocks]
        
        return {
            "status": "success",
            "data": {
                "blocks": transformed_blocks
            }
        }
    except Exception as e:
        logger.error(f"Error fetching text blocks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{project_id}")
async def save_text_blocks(project_id: str, payload: BlocksPayload = Body(...)):
    """
    Save one or more text blocks for a project. This endpoint handles both creation and updates.
    Args:
        project_id (str): ID of the project
        payload (BlocksPayload): Object containing list of text blocks to save
    Returns:
        dict: Saved text blocks
    """
    try:
        logger.info(f"Received request to save blocks for project {project_id}")
        logger.info(f"Received blocks data: {json.dumps(payload.dict(), indent=2)}")
        
        saved_blocks = []
        for block in payload.blocks:
            saved_block = dynamodb_service.save_text_block(
                project_id=project_id,
                block_id=str(block.id),  # Convert numeric ID to string for DynamoDB
                content=block.content,
                order=block.order
            )
            saved_blocks.append(saved_block)
        
        return {
            "status": "success",
            "data": {
                "blocks": saved_blocks
            }
        }
    except Exception as e:
        logger.error(f"Error saving text blocks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{project_id}/{block_id}")
async def delete_text_block(project_id: str, block_id: str):
    """
    Delete a text block
    Args:
        project_id (str): ID of the project containing the block
        block_id (str): ID of the block to delete
    Returns:
        dict: Success message
    """
    try:
        logger.info(f"Deleting text block {block_id} from project {project_id}")
        dynamodb_service.delete_text_block(project_id, block_id)
        
        return {
            "status": "success",
            "message": "Text block deleted successfully"
        }
    except Exception as e:
        logger.error(f"Error deleting text block: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
