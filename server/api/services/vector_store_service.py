from typing import List, Dict, Optional
import os
from openai import OpenAI

class VectorStoreService:
    def __init__(self):
        self.client = OpenAI()

    async def create_vector_store(self, name: str, file_ids: List[str], expiration_days: Optional[int] = 7) -> Dict:
        """
        Create a new vector store with the given files.
        
        Args:
            name (str): Name of the vector store
            file_ids (List[str]): List of file IDs to add to the vector store
            expiration_days (Optional[int]): Number of days after which the vector store expires
            
        Returns:
            Dict: Created vector store object
        """
        try:
            vector_store = self.client.beta.vector_stores.create(
                name=name,
                file_ids=file_ids,
                expires_after={
                    "anchor": "last_active_at",
                    "days": expiration_days
                }
            )
            return vector_store
        except Exception as e:
            raise Exception(f"Failed to create vector store: {str(e)}")

    async def add_files_to_store(self, vector_store_id: str, file_ids: List[str]) -> Dict:
        """
        Add files to an existing vector store.
        
        Args:
            vector_store_id (str): ID of the vector store
            file_ids (List[str]): List of file IDs to add
            
        Returns:
            Dict: Batch creation response
        """
        try:
            batch = self.client.beta.vector_stores.file_batches.create_and_poll(
                vector_store_id=vector_store_id,
                file_ids=file_ids
            )
            return batch
        except Exception as e:
            raise Exception(f"Failed to add files to vector store: {str(e)}")

    async def get_vector_store(self, vector_store_id: str) -> Dict:
        """
        Get details of a vector store.
        
        Args:
            vector_store_id (str): ID of the vector store
            
        Returns:
            Dict: Vector store details
        """
        try:
            return self.client.beta.vector_stores.retrieve(vector_store_id)
        except Exception as e:
            raise Exception(f"Failed to retrieve vector store: {str(e)}")
