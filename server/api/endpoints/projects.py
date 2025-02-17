from fastapi import APIRouter, HTTPException, Request
from ..services.dynamodb_service import DynamoDBService
from ..services.assistant_service import AssistantService
from datetime import datetime
from typing import Optional, Dict, Any, List, Union
from pydantic import BaseModel, ValidationError, root_validator
import logging
import traceback
import json
from decimal import Decimal

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
    blocks: List[Dict[str, Any]]

class ProjectRequest(BaseModel):
    userId: str
    canvas: CanvasData

# Define response models
class ProjectData(BaseModel):
    projectId: str
    userId: str
    title: str
    blocks: List[Dict[str, Any]] = []
    editedAt: Optional[str] = None
    lastModified: Optional[str] = None
    dateCreated: Optional[str] = None
    assistantId: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    @root_validator(pre=True)
    def check_dates(cls, values):
        # Ensure we have at least one date field
        if not any(values.get(field) for field in ['editedAt', 'lastModified', 'dateCreated']):
            values['editedAt'] = datetime.utcnow().isoformat()
        return values

    class Config:
        extra = "allow"  # Allow extra fields

class ProjectsResponse(BaseModel):
    status: str
    data: List[ProjectData]

def handle_decimal_serialization(obj):
    if isinstance(obj, Decimal):
        return str(obj)
    elif isinstance(obj, dict):
        return {k: handle_decimal_serialization(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [handle_decimal_serialization(i) for i in obj]
    return obj

router = APIRouter(prefix="/projects")
dynamodb_service = DynamoDBService()
assistant_service = AssistantService()

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return super(DecimalEncoder, self).default(obj)

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
        canvas_data = project_request.canvas.dict()
        logger.info(f"Canvas data received: {json.dumps(canvas_data, indent=2)}")
        logger.info(f"editedAt value: {canvas_data.get('editedAt', 'NOT_FOUND')}")

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
            # Ensure we have a valid editedAt
            if not canvas_dict.get('editedAt'):
                canvas_dict['editedAt'] = datetime.utcnow().isoformat()
                logger.info(f"No editedAt provided, using current time: {canvas_dict['editedAt']}")

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

@router.post("/update")
async def update_project(request: Request, project_request: ProjectRequest):
    """
    Update an existing project
    Args:
        request (Request): The raw request object for logging
        project_request (ProjectRequest): Project update request containing userId and canvas data
    Returns:
        dict: Updated project information
    """
    try:
        # Log the raw request data
        raw_body = await request.body()
        logger.info(f"Received raw request body: {raw_body.decode()}")
        
        logger.info(f"Processing project update request for user: {project_request.userId}")
        logger.info(f"Canvas data: {json.dumps(project_request.canvas.dict(), indent=2)}")

        # Prepare the item for DynamoDB
        item = {
            "userId": project_request.userId,
            "projectId": project_request.canvas.id,
            "title": project_request.canvas.title,
            "lastModified": project_request.canvas.editedAt,
            "blocks": project_request.canvas.blocks
        }

        # Save to DynamoDB
        updated_project = dynamodb_service.save_project(item)
        
        return {
            "status": "success",
            "data": {
                "project": updated_project
            }
        }

    except ValidationError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating project: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

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
        
        # Get projects from DynamoDB
        projects = dynamodb_service.get_user_projects(user_id)
        logger.info(f"Found {len(projects)} projects for user")
        
        # Log raw projects for debugging
        logger.debug("Raw projects from DynamoDB:")
        for i, proj in enumerate(projects):
            logger.debug(f"Project {i + 1}: {proj}")
        
        # Handle Decimal serialization
        serialized_projects = handle_decimal_serialization(projects)
        
        # Log serialized projects for debugging
        logger.debug("Serialized projects:")
        for i, proj in enumerate(serialized_projects):
            logger.debug(f"Serialized Project {i + 1}: {proj}")
        
        # Validate each project against our model
        validated_projects = []
        for project in serialized_projects:
            try:
                validated_project = ProjectData(**project)
                validated_projects.append(validated_project.dict(exclude_unset=True))
            except ValidationError as ve:
                logger.error(f"Validation error for project: {project}")
                logger.error(f"Validation error details: {str(ve)}")
                # Instead of skipping, try to salvage what we can
                try:
                    # Create a minimal valid project
                    minimal_project = {
                        'projectId': project.get('projectId', ''),
                        'userId': project.get('userId', user_id),
                        'title': project.get('title', 'Untitled'),
                        'blocks': project.get('blocks', []),
                        'editedAt': project.get('editedAt') or project.get('lastModified') or datetime.utcnow().isoformat()
                    }
                    validated_project = ProjectData(**minimal_project)
                    validated_projects.append(validated_project.dict(exclude_unset=True))
                except Exception as e:
                    logger.error(f"Failed to salvage project: {str(e)}")
                    continue
        
        # Create the response using our response model
        response = ProjectsResponse(
            status='success',
            data=validated_projects
        )
        
        # Convert to dict for final response
        return response.dict(exclude_unset=True)

    except Exception as e:
        logger.error(f"Error fetching user projects: {str(e)}")
        logger.error(f"Error details: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch projects: {str(e)}"
        )
