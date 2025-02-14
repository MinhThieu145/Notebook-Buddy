from fastapi import APIRouter, HTTPException, Request
from ..services.dynamodb_service import DynamoDBService
from ..services.assistant_service import AssistantService
from datetime import datetime
from typing import Optional, Dict, Any
import logging
from pydantic import BaseModel, ValidationError
import traceback
import json

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Define request models
class CanvasData(BaseModel):
    id: str
    title: str
    editedAt: str
    blocks: list[Dict[str, Any]]

class ProjectRequest(BaseModel):
    userId: str
    canvas: CanvasData

router = APIRouter(prefix="/projects")
dynamodb_service = DynamoDBService()
assistant_service = AssistantService()

@router.post("/create")
async def create_project(request: Request, project_request: ProjectRequest):
    """
    Create a new project with an associated AI assistant
    Args:
        request (Request): The raw request object for logging
        project_request (ProjectRequest): Project creation request containing userId and canvas data
    Returns:
        dict: Created project and assistant information
    """
    try:
        # Log the raw request data
        raw_body = await request.body()
        logger.info(f"Received raw request body: {raw_body.decode()}")
        
        logger.info(f"Processing project creation request for user: {project_request.userId}")
        logger.info(f"Canvas data: {json.dumps(project_request.canvas.dict(), indent=2)}")

        # Create an assistant for this project
        try:
            logger.info("Creating new assistant with OpenAI")
            assistant_dict = await assistant_service.create_assistant(
                model="gpt-4-1106-preview",
                name=f"Project Assistant - {project_request.canvas.title}",
                description="AI assistant for notebook project",
                instructions="You are a helpful assistant for managing and analyzing notebook content."
            )
            
            if not assistant_dict or 'id' not in assistant_dict:
                logger.error(f"Invalid assistant response: {assistant_dict}")
                raise ValueError("Invalid assistant response received")
                
            logger.info(f"Assistant created successfully with ID: {assistant_dict['id']}")
            
        except Exception as e:
            logger.error(f"Failed to create assistant: {str(e)}")
            logger.error(f"Assistant creation error details: {traceback.format_exc()}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to create assistant: {str(e)}"
            )

        # Prepare the item for DynamoDB
        try:
            canvas_dict = project_request.canvas.dict()
            item = {
                'projectId': canvas_dict['id'],
                'userId': project_request.userId,
                'title': canvas_dict['title'],
                'editedAt': canvas_dict['editedAt'],
                'blocks': canvas_dict['blocks'],
                'dateCreated': datetime.utcnow().isoformat(),
                'assistantId': assistant_dict['id'],
                'metadata': {
                    'assistantName': assistant_dict.get('name', 'Untitled Assistant'),
                    'lastModified': datetime.utcnow().isoformat()
                }
            }
            logger.info(f"Prepared DynamoDB item: {json.dumps(item, indent=2)}")
        except Exception as e:
            logger.error(f"Failed to prepare DynamoDB item: {str(e)}")
            logger.error(f"Item preparation error details: {traceback.format_exc()}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to prepare project data: {str(e)}"
            )

        # Save to DynamoDB
        try:
            logger.info(f"Saving project to DynamoDB with ID: {item['projectId']}")
            dynamodb_service.save_project(item)
            logger.info("Project saved successfully to DynamoDB")
        except Exception as e:
            logger.error(f"Failed to save to DynamoDB: {str(e)}")
            logger.error(f"DynamoDB error details: {traceback.format_exc()}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to save to database: {str(e)}"
            )

        return {
            'status': 'success',
            'data': {
                'project': item,
                'assistant': assistant_dict
            }
        }

    except ValidationError as e:
        logger.error(f"Request validation error: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in create_project: {str(e)}")
        logger.error(f"Full error details: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail=f"Unexpected error: {str(e)}\nStack trace: {traceback.format_exc()}"
        )

@router.get("/{user_id}")
async def get_user_projects(user_id: str):
    """
    Get all projects for a specific user
    Args:
        user_id (str): ID of the user whose projects to retrieve
    Returns:
        dict: List of user's projects
    """
    try:
        logger.info(f"Fetching projects for user: {user_id}")
        projects = dynamodb_service.get_user_projects(user_id)
        logger.info(f"Found {len(projects)} projects for user")
        logger.debug(f"Projects data: {json.dumps(projects, indent=2)}")
        return {
            'status': 'success',
            'data': projects
        }

    except Exception as e:
        logger.error(f"Error fetching user projects: {str(e)}")
        logger.error(f"Error details: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch projects: {str(e)}"
        )
