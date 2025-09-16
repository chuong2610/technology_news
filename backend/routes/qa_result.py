

from typing import List
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from backend.service.qa_result_service import create_qa_result_service, get_all_qa_results_by_user_and_qa_service, get_all_qa_results_by_user_service, get_all_qa_results_service, get_qa_result_by_id_service


class qa_result_request(BaseModel):
    qa_id: str
    user_id: str
    qa: dict  # Changed from List[dict] to dict to match frontend structure

qas_result = APIRouter( prefix="/api/qas-results", tags=["QA-Results"])

@qas_result.post("/")
async def submit_qa_result(qa_result_data: qa_result_request):
    try:
        qa_result = await create_qa_result_service(
            qa_id=qa_result_data.qa_id,
            user_id=qa_result_data.user_id,
            qa=qa_result_data.qa
        )
        return {"success": True, "data": qa_result}
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"success": False, "message": "Internal server error", "error": str(e)}
        )
    
@qas_result.get("/")
async def get_all_qa_results():
    try:
        qa_results = await get_all_qa_results_service()
        return {"success": True, "data": qa_results}
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"success": False, "message": "Internal server error", "error": str(e)}
        )

# @qas_result.get("/user/{user_id}")
# async def get_all_qa_results_by_user(user_id: str):
#     try:
#         qa_results = await get_all_qa_results_by_user_service(user_id)
#         return {"success": True, "data": qa_results}
#     except Exception as e:
#         return JSONResponse(
#             status_code=500, 
#             content={"success": False, "message": "Internal server error", "error": str(e)}
#         )   
@qas_result.get("/user/{user_id}/qa/{qa_id}")
async def get_all_qa_results_by_user_and_qa(user_id: str, qa_id: str):
    try:
        qa_results = await get_all_qa_results_by_user_and_qa_service(user_id, qa_id)
        return {"success": True, "data": qa_results}
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"success": False, "message": "Internal server error", "error": str(e)}
        )     

@qas_result.get("/{qa_result_id}")
async def get_qa_result_by_id(qa_result_id: str):
    try:
        qa_result = await get_qa_result_by_id_service(qa_result_id)
        if not qa_result:
            return JSONResponse(
                status_code=404, 
                content={"success": False, "message": "QA Result not found"}
            )
        return {"success": True, "data": qa_result}
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"success": False, "message": "Internal server error", "error": str(e)}
        )    
        