import os
from pinecone import Pinecone, ServerlessSpec
from typing import List, Dict, Optional, Any, Union
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO)

class PineconeService:
    def __init__(self):
        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            raise ValueError("PINECONE_API_KEY environment variable is not set")
        self.client = Pinecone(api_key=api_key)
        
    async def create_index(self, name: str, dimension: int, cloud_provider: str = "aws", 
                          region: str = "us-east-1", metric: str = "cosine") -> Dict:
        """
        Create a new Pinecone index.
        
        Args:
            name (str): Name of the index
            dimension (int): Dimension of the vectors
            cloud_provider (str): Cloud provider (aws, gcp, azure)
            region (str): Region for the cloud provider
            metric (str): Distance metric (cosine, dotproduct, euclidean)
            
        Returns:
            Dict: Response from Pinecone API
        """
        try:
            response = self.client.create_index(
                name=name,
                dimension=dimension,
                metric=metric,
                spec=ServerlessSpec(
                    cloud=cloud_provider,
                    region=region
                )
            )
            return {"status": "success", "message": f"Index {name} created successfully", "data": response}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def create_index_with_embedding(self, name: str, embed_model: str = "multilingual-e5-large", 
                                         field_map: Dict[str, str] = None, cloud_provider: str = "aws", 
                                         region: str = "us-east-1") -> Dict:
        """
        Create a new index with integrated embedding.
        
        Args:
            name (str): Name of the index
            embed_model (str): Embedding model to use
            field_map (Dict[str, str]): Mapping of field names to embedding field names
            cloud_provider (str): Cloud provider (aws, gcp, azure)
            region (str): Region for the cloud provider
            
        Returns:
            Dict: Created index configuration
        """
        if field_map is None:
            field_map = {"text": "content"}
        
        try:
            response = self.client.create_index(
                name=name,
                dimension=1536,  # Default dimension for most embedding models
                metric="cosine",
                spec=ServerlessSpec(
                    cloud=cloud_provider,
                    region=region
                ),
                source_collection={
                    "embed": {
                        "model": embed_model,
                        "field_map": field_map
                    }
                }
            )
            return {"status": "success", "message": f"Index {name} created successfully with embedding", "data": response}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def list_indexes(self) -> Dict:
        """
        List all Pinecone indexes.
        
        Returns:
            Dict: List of indexes
        """
        try:
            indexes = self.client.list_indexes()
            return {"status": "success", "indexes": indexes}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def delete_index(self, index_name: str) -> Dict:
        """
        Delete a Pinecone index.
        
        Args:
            index_name (str): Name of the index to delete
            
        Returns:
            Dict: Deletion status
        """
        try:
            self.client.delete_index(index_name)
            return {"status": "success", "message": f"Index {index_name} deleted successfully"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def upsert_vectors(self, index_name: str, vectors: List[Dict], namespace: str = "") -> Dict:
        """
        Upsert vectors to a Pinecone index.
        
        Args:
            index_name (str): Name of the index
            vectors (List[Dict]): List of vectors with id, values, and metadata
            namespace (str): Namespace for the vectors
            
        Returns:
            Dict: Upsert response
        """
        try:
            index = self.client.Index(index_name)
            
            # Format vectors for Pinecone API
            formatted_vectors = []
            for vector in vectors:
                formatted_vector = {
                    "id": vector["id"],
                    "values": vector["values"]
                }
                if "metadata" in vector:
                    formatted_vector["metadata"] = vector["metadata"]
                formatted_vectors.append(formatted_vector)
            
            response = index.upsert(vectors=formatted_vectors, namespace=namespace)
            return {"status": "success", "upserted_count": response["upserted_count"]}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def upsert_records(self, index_name: str, records: List[Dict], namespace: str = "") -> Dict:
        """
        Upsert records to a Pinecone index with integrated embedding.
        
        Args:
            index_name (str): Name of the index
            records (List[Dict]): List of records with _id and content fields
            namespace (str, optional): Namespace to upsert to. Defaults to "".
            
        Returns:
            Dict: Upsert response
        """
        try:
            logging.info(f"[upsert_records] Starting upsert to index {index_name}, namespace {namespace}")
            logging.info(f"[upsert_records] Records to upsert: {records}")
            
            index = await self._get_index(index_name)
            
            if not index:
                logging.error(f"[upsert_records] Index {index_name} not found")
                return {"status": "error", "message": f"Index {index_name} not found"}
            
            # Process records
            vectors = []
            for record in records:
                # Get required fields
                record_id = record.get("_id")
                content = record.get("content")
                
                logging.info(f"[upsert_records] Processing record {record_id}")
                
                if not record_id or not content:
                    logging.error("[upsert_records] Missing _id or content in record")
                    return {"status": "error", "message": "Each record must have _id and content fields"}
                
                # Get embedding for content
                logging.info(f"[upsert_records] Getting embedding for record {record_id}")
                embedding = await self._get_embedding(content)
                
                # The _get_embedding method now always returns an embedding (either real or placeholder)
                # so this check is no longer needed, but we'll keep it for robustness
                if not embedding:
                    logging.error(f"[upsert_records] Failed to get embedding for record {record_id}")
                    return {"status": "error", "message": f"Failed to get embedding for record {record_id}"}
                
                # Create vector
                vector = {
                    "id": str(record_id),  # Ensure ID is a string
                    "values": embedding,
                    "metadata": {
                        "content": content
                    }
                }
                
                # Add title if available
                if "title" in record:
                    vector["metadata"]["title"] = record["title"]
                
                # Add any other metadata
                if "metadata" in record:
                    for key, value in record["metadata"].items():
                        vector["metadata"][key] = value
                
                vectors.append(vector)
            
            # Upsert vectors
            logging.info(f"[upsert_records] Upserting {len(vectors)} vectors to Pinecone")
            upsert_response = index.upsert(vectors=vectors, namespace=namespace)
            
            # Convert the response to a serializable format
            response_dict = {}
            if hasattr(upsert_response, "upserted_count"):
                response_dict["upserted_count"] = int(upsert_response.upserted_count)
            else:
                # If the response is already a dict
                response_dict = dict(upsert_response)
            
            logging.info(f"[upsert_records] Upsert response: {response_dict}")
            
            return {
                "status": "success", 
                "message": f"Upserted {len(vectors)} records", 
                "upserted_count": response_dict.get("upserted_count", len(vectors))
            }
        except Exception as e:
            logging.error(f"[upsert_records] Exception: {str(e)}")
            import traceback
            logging.error(f"[upsert_records] Traceback: {traceback.format_exc()}")
            return {"status": "error", "message": str(e)}
    
    async def query(self, index_name: str, vector: List[float], top_k: int = 10, 
                   namespace: str = "", include_metadata: bool = True) -> Dict:
        """
        Query a Pinecone index with a vector.
        
        Args:
            index_name (str): Name of the index
            vector (List[float]): Query vector
            top_k (int): Number of results to return
            namespace (str): Namespace to query
            include_metadata (bool): Whether to include metadata in results
            
        Returns:
            Dict: Query response
        """
        try:
            index = self.client.Index(index_name)
            response = index.query(
                vector=vector,
                top_k=top_k,
                namespace=namespace,
                include_metadata=include_metadata
            )
            return {"status": "success", "matches": response.get("matches", [])}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def search_records(self, index_name: str, text_query: str, top_k: int = 10, 
                           namespace: str = "", rerank: bool = False, 
                           rerank_model: str = "rerank-english-v2.0", 
                           rank_fields: List[str] = None, top_n: int = None) -> Dict:
        """
        Search for records in a Pinecone index using a text query.
        
        Args:
            index_name (str): Name of the index
            text_query (str): Text query to search for
            top_k (int, optional): Number of results to return. Defaults to 10.
            namespace (str, optional): Namespace to search in. Defaults to "".
            rerank (bool, optional): Whether to rerank results. Defaults to False.
            rerank_model (str, optional): Model to use for reranking. Defaults to "rerank-english-v2.0".
            rank_fields (List[str], optional): Fields to use for reranking. Defaults to None.
            top_n (int, optional): Number of results to return after reranking. Defaults to None.
            
        Returns:
            Dict: Search response
        """
        try:
            logging.info(f"[search_records] Starting search in index {index_name}, namespace {namespace}")
            logging.info(f"[search_records] Text query: {text_query[:50]}...")
            
            # Get the embedding for the text query
            logging.info(f"[search_records] Getting embedding for text query")
            embedding = await self._get_embedding(text_query)
            
            if not embedding:
                logging.error(f"[search_records] Failed to get embedding for text query")
                return {"status": "error", "message": "Failed to get embedding for text query"}
            
            # Get the index
            index = await self._get_index(index_name)
            
            if not index:
                logging.error(f"[search_records] Index {index_name} not found")
                return {"status": "error", "message": f"Index {index_name} not found"}
            
            # Query the index
            logging.info(f"[search_records] Querying Pinecone with top_k={top_k}")
            query_response = index.query(
                vector=embedding,
                top_k=top_k,
                namespace=namespace,
                include_metadata=True
            )
            
            # Convert the response to a serializable format
            matches = []
            if "matches" in query_response:
                for match in query_response["matches"]:
                    # Create a serializable match object
                    serializable_match = {
                        "id": str(match.get("id", "")),
                        "score": float(match.get("score", 0.0)),
                        "metadata": dict(match.get("metadata", {}))
                    }
                    matches.append(serializable_match)
            
            logging.info(f"[search_records] Found {len(matches)} matches")
            
            # Rerank results if requested
            if rerank and matches:
                logging.info(f"[search_records] Reranking results with model {rerank_model}")
                # TODO: Implement reranking
                pass
            
            return {"status": "success", "matches": matches}
        except Exception as e:
            logging.error(f"[search_records] Exception: {str(e)}")
            import traceback
            logging.error(f"[search_records] Traceback: {traceback.format_exc()}")
            return {"status": "error", "message": str(e)}
    
    async def describe_index(self, index_name: str) -> Dict:
        """
        Get details of a Pinecone index.
        
        Args:
            index_name (str): Name of the index
            
        Returns:
            Dict: Index details
        """
        try:
            index_description = self.client.describe_index(index_name)
            return {"status": "success", "index": index_description}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def get_index_stats(self, index_name: str) -> Dict:
        """
        Get statistics of a Pinecone index.
        
        Args:
            index_name (str): Name of the index
            
        Returns:
            Dict: Index statistics
        """
        try:
            index = self.client.Index(index_name)
            stats = index.describe_index_stats()
            return {"status": "success", "stats": stats}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def list_records(self, index_name: str, namespace: str = "") -> Dict:
        """
        List records in a Pinecone index.
        
        Args:
            index_name (str): Name of the index
            namespace (str, optional): Namespace to list from. Defaults to "".
            
        Returns:
            Dict: List of records
        """
        try:
            index = await self._get_index(index_name)
            
            if not index:
                return {"status": "error", "message": f"Index {index_name} not found"}
                
            # Since Pinecone doesn't have a direct "list all" API, we'll use describe_index_stats
            # to get information about the vectors in the index
            try:
                stats = index.describe_index_stats()
                
                # Get the total vector count in the namespace
                namespaces = stats.get("namespaces", {})
                
                if namespace and namespace in namespaces:
                    namespace_stats = namespaces.get(namespace, {})
                    vector_count = namespace_stats.get("vector_count", 0)
                else:
                    # If no specific namespace or namespace not found, get total count
                    vector_count = stats.get("total_vector_count", 0)
                
                # For now, we'll return a placeholder response
                # In a real implementation, you might want to use a separate database
                # to store metadata about the vectors for easier listing
                return {
                    "status": "success",
                    "records": [],  # Empty list as placeholder
                    "message": f"There are {vector_count} records in the index/namespace, but Pinecone doesn't support listing all records directly.",
                    "vector_count": vector_count
                }
            except Exception as e:
                return {"status": "error", "message": f"Error getting index stats: {str(e)}"}
                
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def delete_records(self, index_name: str, ids: List[str], namespace: str = "") -> Dict:
        """
        Delete vectors from a Pinecone index.
        
        Args:
            index_name (str): Name of the index
            ids (List[str]): List of vector IDs to delete
            namespace (str, optional): Namespace to delete from. Defaults to "".
            
        Returns:
            Dict: Deletion response
        """
        try:
            logging.info(f"[delete_records] Starting deletion from index {index_name}, namespace {namespace}")
            logging.info(f"[delete_records] IDs to delete: {ids}")
            
            index = await self._get_index(index_name)
            
            if not index:
                logging.error(f"[delete_records] Index {index_name} not found")
                return {"status": "error", "message": f"Index {index_name} not found"}
            
            logging.info(f"[delete_records] Deleting {len(ids)} vectors from Pinecone")
            delete_response = index.delete(ids=ids, namespace=namespace)
            
            # Convert the response to a serializable format
            response_dict = {}
            if hasattr(delete_response, "deleted_count"):
                response_dict["deleted_count"] = int(delete_response.deleted_count)
            else:
                # If the response is already a dict
                response_dict = dict(delete_response) if delete_response else {}
            
            logging.info(f"[delete_records] Delete response: {response_dict}")
            
            return {
                "status": "success", 
                "message": "Vectors deleted successfully",
                "deleted_count": response_dict.get("deleted_count", len(ids))
            }
        except Exception as e:
            logging.error(f"[delete_records] Exception: {str(e)}")
            import traceback
            logging.error(f"[delete_records] Traceback: {traceback.format_exc()}")
            return {"status": "error", "message": str(e)}
    
    async def _get_index(self, index_name: str):
        try:
            return self.client.Index(index_name)
        except Exception as e:
            return None
    
    async def _get_embedding(self, text_query: str):
        try:
            logging.info(f"[_get_embedding] Getting embedding for text: {text_query[:50]}...")
            
            # Use OpenAI's text-embedding-3-large model for better quality embeddings
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            
            # Check if API key is available
            if not os.getenv("OPENAI_API_KEY"):
                logging.warning("[_get_embedding] OPENAI_API_KEY not found, using placeholder embedding")
                # Fallback to placeholder if no API key
                import random
                embedding = [random.uniform(-1, 1) for _ in range(3072)]  # text-embedding-3-large uses 3072 dimensions
                logging.info(f"[_get_embedding] Generated placeholder embedding with {len(embedding)} dimensions")
                return embedding
            
            # Call OpenAI API to get the embedding
            logging.info("[_get_embedding] Calling OpenAI API for embedding")
            response = client.embeddings.create(
                input=text_query,
                model="text-embedding-3-large"  # Using the large model for better quality
            )
            
            # Extract the embedding from the response to avoid serialization issues
            embedding = list(response.data[0].embedding)  # Convert to list to ensure it's serializable
            logging.info(f"[_get_embedding] Received embedding from OpenAI with {len(embedding)} dimensions")
            return embedding
            
        except Exception as e:
            logging.error(f"[_get_embedding] Error getting embedding: {str(e)}")
            import traceback
            logging.error(f"[_get_embedding] Traceback: {traceback.format_exc()}")
            
            # Fallback to placeholder in case of error
            logging.warning("[_get_embedding] Error occurred, using placeholder embedding")
            import random
            return [random.uniform(-1, 1) for _ in range(3072)]  # text-embedding-3-large uses 3072 dimensions
