from fastapi import APIRouter, HTTPException, Request
from ..services.dynamodb_service import DynamoDBService
from typing import Dict, Any, List
import logging
import json

# Configure logging
logger = logging.getLogger(__name__)

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
        
        return {
            "status": "success",
            "data": blocks
        }
    except Exception as e:
        logger.error(f"Error fetching text blocks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{project_id}")
async def create_text_block(project_id: str, request: Request):
    """
    Create a new text block for a project
    Args:
        project_id (str): ID of the project to create the block for
        request (Request): Request containing the block data
    Returns:
        dict: Created text block
    """
    try:
        body = await request.json()
        logger.info(f"Creating text block for project {project_id} with data: {json.dumps(body, indent=2)}")
        
        block = dynamodb_service.save_text_block(
            project_id=project_id,
            block_id=body.get("id"),
            content=body.get("content")
        )
        
        return {
            "status": "success",
            "data": block
        }
    except Exception as e:
        logger.error(f"Error creating text block: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{project_id}/{block_id}")
async def update_text_block(project_id: str, block_id: str, request: Request):
    """
    Update an existing text block
    Args:
        project_id (str): ID of the project containing the block
        block_id (str): ID of the block to update
        request (Request): Request containing the updated block data
    Returns:
        dict: Updated text block
    """
    try:
        body = await request.json()
        logger.info(f"Updating text block {block_id} in project {project_id} with data: {json.dumps(body, indent=2)}")
        
        block = dynamodb_service.save_text_block(
            project_id=project_id,
            block_id=block_id,
            content=body.get("content")
        )
        
        return {
            "status": "success",
            "data": block
        }
    except Exception as e:
        logger.error(f"Error updating text block: {str(e)}")
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
