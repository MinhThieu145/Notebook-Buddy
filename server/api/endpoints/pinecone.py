from fastapi import APIRouter, Depends, HTTPException, Request, Path, Query, Body
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from ..services.pinecone_service import PineconeService

# Router setup
router = APIRouter()
pinecone_service = PineconeService()

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
