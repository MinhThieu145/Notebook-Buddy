from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from pydantic import BaseModel
from ..services.vector_store_service import VectorStoreService

class CreateVectorStoreRequest(BaseModel):
    name: str
    file_ids: List[str]
    expiration_days: Optional[int] = 7

class AddFilesRequest(BaseModel):
    file_ids: List[str]

router = APIRouter()
vector_store_service = VectorStoreService()

@router.post("/vector-stores")
async def create_vector_store(request: CreateVectorStoreRequest) -> Dict:
    """
    Create a new vector store with the specified files.
    
    Args:
        request (CreateVectorStoreRequest): Request containing store name and file IDs
        
    Returns:
        Dict: Created vector store object
    """
    try:
        vector_store = await vector_store_service.create_vector_store(
            name=request.name,
            file_ids=request.file_ids,
            expiration_days=request.expiration_days
        )
        return {
            "status": "success",
            "data": vector_store
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/vector-stores/{vector_store_id}/files")
async def add_files(vector_store_id: str, request: AddFilesRequest) -> Dict:
    """
    Add files to an existing vector store.
    
    Args:
        vector_store_id (str): ID of the vector store
        request (AddFilesRequest): Request containing file IDs to add
        
    Returns:
        Dict: Batch creation response
    """
    try:
        batch = await vector_store_service.add_files_to_store(
            vector_store_id=vector_store_id,
            file_ids=request.file_ids
        )
        return {
            "status": "success",
            "data": batch
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vector-stores/{vector_store_id}")
async def get_vector_store(vector_store_id: str) -> Dict:
    """
    Get details of a vector store.
    
    Args:
        vector_store_id (str): ID of the vector store
        
    Returns:
        Dict: Vector store details
    """
    try:
        store = await vector_store_service.get_vector_store(vector_store_id)
        return {
            "status": "success",
            "data": store
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
