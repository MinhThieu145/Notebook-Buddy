from typing import List, Dict, Optional, Union
from openai import OpenAI
import logging
import json

logger = logging.getLogger(__name__)

class AssistantService:
    def __init__(self):
        self.client = OpenAI()

    async def create_assistant(
        self,
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
    ) -> Dict:
        """
        Create a new OpenAI assistant.
        """
        try:
            # Build create parameters, excluding None values
            create_params = {
                "model": model,
                **({"name": name} if name is not None else {}),
                **({"description": description} if description is not None else {}),
                **({"instructions": instructions} if instructions is not None else {}),
                **({"tools": tools} if tools is not None else {}),
                **({"tool_resources": tool_resources} if tool_resources is not None else {}),
                **({"metadata": metadata} if metadata is not None else {}),
                **({"temperature": temperature} if temperature is not None else {}),
                **({"top_p": top_p} if top_p is not None else {}),
                **({"response_format": response_format} if response_format is not None else {}),
                **({"reasoning_effort": reasoning_effort} if reasoning_effort is not None else {})
            }
            
            logger.info(f"Creating assistant with parameters: {create_params}")
            assistant = self.client.beta.assistants.create(**create_params)
            
            # Debug log the raw assistant response
            logger.debug(f"Raw assistant response: {assistant}")
            
            # Convert OpenAI response to dictionary
            assistant_dict = {
                'id': assistant.id,  # This is a required field in OpenAI's response
                'name': assistant.name,  # This will be None if not provided
                'model': assistant.model,  # This is a required field
                'description': assistant.description,  # This will be None if not provided
                'instructions': assistant.instructions,  # This will be None if not provided
                'tools': assistant.tools,  # This will be [] by default
                'metadata': assistant.metadata,  # This will be {} by default
                'created_at': assistant.created_at  # This is always provided
            }
            
            logger.info(f"Assistant created successfully with ID: {assistant_dict['id']}")
            logger.debug(f"Full assistant dictionary: {json.dumps(assistant_dict, indent=2)}")
            return assistant_dict
            
        except Exception as e:
            logger.error(f"Failed to create assistant: {str(e)}")
            logger.error(f"Error type: {type(e)}")
            raise Exception(f"Failed to create assistant: {str(e)}")

    async def list_assistants(self, limit: Optional[int] = None, order: Optional[str] = None) -> Dict:
        """
        List all assistants.
        """
        try:
            params = {}
            if limit is not None:
                params["limit"] = limit
            if order is not None:
                params["order"] = order
                
            response = self.client.beta.assistants.list(**params)
            assistants_list = [{
                'id': assistant.id,
                'name': assistant.name,
                'model': assistant.model,
                'description': assistant.description,
                'instructions': assistant.instructions,
                'tools': assistant.tools,
                'metadata': assistant.metadata,
                'created_at': assistant.created_at
            } for assistant in response.data]
            
            return {
                'data': assistants_list,
                'has_more': response.has_more if hasattr(response, 'has_more') else False
            }
            
        except Exception as e:
            logger.error(f"Failed to list assistants: {str(e)}")
            raise Exception(f"Failed to list assistants: {str(e)}")

    async def get_assistant(self, assistant_id: str) -> Dict:
        """
        Retrieve a specific assistant.
        """
        try:
            assistant = self.client.beta.assistants.retrieve(assistant_id)
            assistant_dict = {
                'id': assistant.id,
                'name': assistant.name,
                'model': assistant.model,
                'description': assistant.description,
                'instructions': assistant.instructions,
                'tools': assistant.tools,
                'metadata': assistant.metadata,
                'created_at': assistant.created_at
            }
            return assistant_dict
        except Exception as e:
            logger.error(f"Failed to retrieve assistant: {str(e)}")
            raise Exception(f"Failed to retrieve assistant: {str(e)}")
