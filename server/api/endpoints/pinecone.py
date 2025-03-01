from fastapi import APIRouter, Depends, HTTPException, Request, Path, Query, Body
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from ..services.pinecone_service import PineconeService

# Request models
class CreateIndexRequest(BaseModel):
    name: str
    dimension: int
    cloud_provider: Optional[str] = "aws"
    region: Optional[str] = "us-east-1"
    metric: Optional[str] = "cosine"

class CreateIndexWithEmbeddingRequest(BaseModel):
    name: str
    embed_model: Optional[str] = "multilingual-e5-large"
    field_map: Optional[Dict[str, str]] = None
    cloud_provider: Optional[str] = "aws"
    region: Optional[str] = "us-east-1"

class UpsertVectorsRequest(BaseModel):
    vectors: List[Dict[str, Any]] = Field(..., description="List of vectors with id, values, and metadata")
    namespace: Optional[str] = ""

class UpsertRecordsRequest(BaseModel):
    records: List[Dict[str, Any]] = Field(..., description="List of records with _id and content fields")
    namespace: Optional[str] = ""

class QueryRequest(BaseModel):
    vector: List[float]
    top_k: Optional[int] = 10
    namespace: Optional[str] = ""
    include_metadata: Optional[bool] = True

class SearchRecordsRequest(BaseModel):
    text_query: str
    top_k: Optional[int] = 10
    namespace: Optional[str] = ""
    rerank: Optional[bool] = False
    rerank_model: Optional[str] = "bge-reranker-v2-m3"
    rank_fields: Optional[List[str]] = None
    top_n: Optional[int] = None

# Router setup
router = APIRouter()
pinecone_service = PineconeService()

@router.post("/indexes")
async def create_index(request: CreateIndexRequest):
    """
    Create a new Pinecone index.
    
    Args:
        request (CreateIndexRequest): Request containing index configuration
        
    Returns:
        Dict: Created index configuration
    """
    try:
        result = await pinecone_service.create_index(
            name=request.name,
            dimension=request.dimension,
            cloud_provider=request.cloud_provider,
            region=request.region,
            metric=request.metric
        )
        
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("message"))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/indexes/with-embedding")
async def create_index_with_embedding(request: CreateIndexWithEmbeddingRequest):
    """
    Create a new Pinecone index with integrated embedding.
    
    Args:
        request (CreateIndexWithEmbeddingRequest): Request containing index configuration
        
    Returns:
        Dict: Created index configuration
    """
    try:
        result = await pinecone_service.create_index_with_embedding(
            name=request.name,
            embed_model=request.embed_model,
            field_map=request.field_map,
            cloud_provider=request.cloud_provider,
            region=request.region
        )
        
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("message"))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/indexes")
async def list_indexes():
    """
    List all Pinecone indexes.
    
    Returns:
        Dict: List of indexes
    """
    try:
        result = await pinecone_service.list_indexes()
        
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("message"))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/indexes/{index_name}")
async def delete_index(index_name: str):
    """
    Delete a Pinecone index.
    
    Args:
        index_name (str): Name of the index to delete
        
    Returns:
        Dict: Deletion status
    """
    try:
        result = await pinecone_service.delete_index(index_name)
        
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("message"))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/indexes/{index_name}/upsert-vectors")
async def upsert_vectors(index_name: str, request: UpsertVectorsRequest) -> Dict:
    """
    Upsert vectors to a Pinecone index.
    
    Args:
        index_name (str): Name of the index
        request (UpsertVectorsRequest): Request containing vectors
        
    Returns:
        Dict: Upsert response
    """
    try:
        # Convert the vectors format from the request to the format expected by the service
        vectors_list = []
        for vector in request.vectors:
            vector_item = {
                "id": vector.get("id"),
                "values": vector.get("values")
            }
            if "metadata" in vector:
                vector_item["metadata"] = vector.get("metadata")
            vectors_list.append(vector_item)
            
        result = await pinecone_service.upsert_vectors(
            index_name=index_name,
            vectors=vectors_list,
            namespace=request.namespace
        )
        
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("message"))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/indexes/{index_name}/records")
async def upsert_records(index_name: str, request: UpsertRecordsRequest):
    """
    Upsert records to a Pinecone index with integrated embedding.
    
    Args:
        index_name (str): Name of the index
        request (UpsertRecordsRequest): Request containing records
        
    Returns:
        Dict: Upsert response
    """
    try:
        result = await pinecone_service.upsert_records(
            index_name=index_name,
            records=request.records,
            namespace=request.namespace
        )
        
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("message"))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/indexes/{index_name}/query")
async def query(index_name: str, request: QueryRequest):
    """
    Query a Pinecone index with a vector.
    
    Args:
        index_name (str): Name of the index
        request (QueryRequest): Request containing query parameters
        
    Returns:
        Dict: Query response
    """
    try:
        result = await pinecone_service.query(
            index_name=index_name,
            vector=request.vector,
            top_k=request.top_k,
            namespace=request.namespace,
            include_metadata=request.include_metadata
        )
        
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("message"))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search")
async def search(request: Request, query_request: QueryRequest):
    """
    Search records in a Pinecone index with a text query.
    
    Args:
        request (Request): The FastAPI request object
        query_request (QueryRequest): Request containing search parameters
        
    Returns:
        Dict: Search response
    """
    try:
        result = await pinecone_service.query(
            index_name=request.query_params.get("index_name", "default"),
            vector=query_request.vector,
            top_k=query_request.top_k,
            namespace=query_request.namespace,
            include_metadata=query_request.include_metadata
        )
        
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message", "Unknown error"))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/indexes/{index_name}/search")
async def search_records(index_name: str, request: SearchRecordsRequest):
    """
    Search records in a Pinecone index with a text query.
    
    Args:
        index_name (str): Name of the index
        request (SearchRecordsRequest): Request containing search parameters
        
    Returns:
        Dict: Search response
    """
    try:
        result = await pinecone_service.search_records(
            index_name=index_name,
            text_query=request.text_query,
            top_k=request.top_k,
            namespace=request.namespace,
            rerank=request.rerank,
            rerank_model=request.rerank_model,
            rank_fields=request.rank_fields,
            top_n=request.top_n
        )
        
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message", "Unknown error"))
        
        # Get matches from results
        matches = result.get("matches", [])
        
        # Filter results by user ID if available
        if request.namespace and matches:
            matches = [
                match for match in matches
                if match.get("metadata", {}).get("userId") == request.namespace
            ]
            
        return {"status": "success", "matches": matches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching texts in vector store: {str(e)}")

@router.get("/indexes/{index_name}")
async def describe_index(index_name: str):
    """
    Get details of a Pinecone index.
    
    Args:
        index_name (str): Name of the index
        
    Returns:
        Dict: Index details
    """
    try:
        result = await pinecone_service.describe_index(index_name)
        
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("message"))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/indexes/{index_name}/stats")
async def get_index_stats(index_name: str):
    """
    Get statistics of a Pinecone index.
    
    Args:
        index_name (str): Name of the index
        
    Returns:
        Dict: Index statistics
    """
    try:
        result = await pinecone_service.get_index_stats(index_name)
        
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("message"))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/notecrafts/save-text")
async def save_text_to_notecrafts(request: Request, data: Dict = Body(...)):
    try:
        # Extract user ID from headers
        user_id = request.headers.get("X-User-ID")
        
        # Log request data
        print(f"[save-text] Request received - User ID: {user_id}")
        print(f"[save-text] Request data: {data}")
        
        # Extract records and namespace from the request body
        records = data.get("records", [])
        namespace = data.get("namespace", "") or user_id or ""
        
        # Add user ID to metadata if available
        if user_id:
            for record in records:
                if "metadata" not in record:
                    record["metadata"] = {}
                record["metadata"]["userId"] = user_id
        
        # Log processed records
        print(f"[save-text] Processed records: {records}")
        
        result = await pinecone_service.upsert_records(
            index_name="notecrafts-test",
            records=records,
            namespace=namespace
        )
        
        # Log result
        print(f"[save-text] Result: {result}")
        
        if result.get("status") != "success":
            error_msg = result.get("message", "Unknown error")
            print(f"[save-text] Error: {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)
            
        return {"status": "success", "message": "Text saved to vector store successfully"}
    except Exception as e:
        print(f"[save-text] Exception: {str(e)}")
        import traceback
        print(f"[save-text] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error saving text to vector store: {str(e)}")

@router.get("/notecrafts/list-texts")
async def list_texts_from_notecrafts(request: Request, namespace: str = ""):
    try:
        # Extract user ID from headers
        user_id = request.headers.get("X-User-ID")
        
        # If no namespace is provided, use the user ID as namespace
        namespace = namespace or user_id or ""
        
        result = await pinecone_service.list_records(
            index_name="notecrafts-test",
            namespace=namespace
        )
        
        if result.get("status") != "success":
            raise HTTPException(status_code=500, detail=result.get("message", "Unknown error"))
            
        # Filter records by user ID if available
        if user_id and "records" in result:
            filtered_records = []
            for record in result["records"]:
                # Check if metadata exists and if userId matches
                if "metadata" in record and record["metadata"].get("userId") == user_id:
                    filtered_records.append(record)
                # For backward compatibility, include records without userId
                elif "metadata" not in record or "userId" not in record["metadata"]:
                    filtered_records.append(record)
            result["records"] = filtered_records
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing texts from vector store: {str(e)}")

@router.delete("/notecrafts/delete-text/{text_id}")
async def delete_text_from_notecrafts(
    request: Request,
    text_id: str = Path(..., description="ID of the text to delete"),
    namespace: str = Query("", description="Namespace to delete text from")
):
    try:
        # Extract user ID from headers
        user_id = request.headers.get("X-User-ID")
        
        # Log request data
        print(f"[delete-text] Request received - User ID: {user_id}, Text ID: {text_id}")
        
        # If no namespace is provided, use the user ID as namespace
        namespace = namespace or user_id or ""
        
        print(f"[delete-text] Using namespace: {namespace}")
        
        result = await pinecone_service.delete_records(
            index_name="notecrafts-test",
            ids=[text_id],
            namespace=namespace
        )
        
        # Log result
        print(f"[delete-text] Result: {result}")
        
        if result.get("status") != "success":
            error_msg = result.get("message", "Unknown error")
            print(f"[delete-text] Error: {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)
            
        return {"status": "success", "message": "Text deleted from vector store successfully"}
    except Exception as e:
        print(f"[delete-text] Exception: {str(e)}")
        import traceback
        print(f"[delete-text] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error deleting text from vector store: {str(e)}")

@router.post("/notecrafts/search-texts")
async def search_texts_in_notecrafts(request: Request, search_request: Dict = Body(...)):
    try:
        # Extract user ID from headers
        user_id = request.headers.get("X-User-ID")
        
        # Log request data
        print(f"[search-texts] Request received - User ID: {user_id}")
        print(f"[search-texts] Request data: {search_request}")
        
        # Extract search parameters
        text_query = search_request.get("text_query", "")
        top_k = search_request.get("top_k", 10)
        namespace = search_request.get("namespace", "") or user_id or ""
        rerank = search_request.get("rerank", False)
        rerank_model = search_request.get("rerank_model", "bge-reranker-v2-m3")
        rank_fields = search_request.get("rank_fields", ["content"])
        top_n = search_request.get("top_n", None)
        
        # Extract filter parameters if provided
        filter_params = search_request.get("filter", {})
        filter_ids = filter_params.get("ids", []) if filter_params else []
        
        print(f"[search-texts] Using namespace: {namespace}")
        if filter_ids:
            print(f"[search-texts] Filtering by IDs: {filter_ids}")
        
        results = await pinecone_service.search_records(
            index_name="notecrafts-test",
            text_query=text_query,
            top_k=top_k,
            namespace=namespace,
            rerank=rerank,
            rerank_model=rerank_model,
            rank_fields=rank_fields,
            top_n=top_n
        )
        
        # Log result
        print(f"[search-texts] Result status: {results.get('status')}")
        
        if results.get("status") != "success":
            error_msg = results.get("message", "Unknown error")
            print(f"[search-texts] Error: {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)
        
        # Get matches from results
        matches = results.get("matches", [])
        print(f"[search-texts] Found {len(matches)} matches")
        
        # Filter results by user ID if available
        if user_id and matches:
            filtered_matches = [
                match for match in matches
                if match.get("metadata", {}).get("userId") == user_id
            ]
            print(f"[search-texts] Filtered to {len(filtered_matches)} matches for user {user_id}")
            matches = filtered_matches
        
        # Filter by specific IDs if provided
        if filter_ids and matches:
            id_filtered_matches = [
                match for match in matches
                if match.get("id") in filter_ids
            ]
            print(f"[search-texts] Filtered to {len(id_filtered_matches)} matches by ID filter")
            matches = id_filtered_matches
            
        return {"status": "success", "matches": matches}
    except Exception as e:
        print(f"[search-texts] Exception: {str(e)}")
        import traceback
        print(f"[search-texts] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error searching texts in vector store: {str(e)}")
