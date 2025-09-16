# routes/qa.py
# Router xử lý các endpoint liên quan đến questions
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from typing import List, Optional
from pydantic import BaseModel

# Import service functions
from backend.service.qa_service import (
    get_all_qa as service_get_all_qa,
    get_qa_by_article_id_service,
    get_qa_by_id as service_get_qa_by_id,
    create_question as service_create_qa,
    update_qa as service_update_qa,
    delete_qa as service_delete_qa
)

class question(BaseModel):
    question_id: Optional[str] = None
    question: Optional[str] = None
    answer_a: Optional[str] = None
    answer_b: Optional[str] = None
    answer_c: Optional[str] = None
    answer_d: Optional[str] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None

class qa_request(BaseModel):
    id: str
    article_id: Optional[str] = None  # Reference to the article
    questions: List[question]

# Tạo router cho question endpoints
qas = APIRouter( prefix="/api/qas", tags=["QA"])

@qas.get("/")
async def get_all_qa():
    try:
        qas = await service_get_all_qa()
        return {"success": True, "data": qas}
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"success": False, "message": "Internal server error", "error": str(e)}
        )

@qas.get("/{qa_id}")
async def get_qa_by_id(qa_id: str):
    try:
        qa = await service_get_qa_by_id(qa_id)
        if not qa:
            raise HTTPException(status_code=404, detail="Question not found")
        return {"success": True, "data": qa}
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"success": False, "message": "Internal server error", "error": str(e)}
        )

@qas.post("/")
async def create_qa(qa_data: qa_request):
    try:
        qa = await service_create_qa(qa_data.dict())
        return {"success": True, "data": qa}
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"success": False, "message": "Internal server error", "error": str(e)}
        )

@qas.put("/{qa_id}")
async def update_qa(qa_id: str, update_data: qa_request):
    try:
        qa = await service_update_qa(qa_id, update_data.dict())
        if not qa:
            raise HTTPException(status_code=404, detail="Question not found")
        return {"success": True, "data": qa}
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"success": False, "message": "Internal server error", "error": str(e)}
        )

@qas.delete("/{qa_id}")
async def delete_qa(qa_id: str):
    try:
        result = await service_delete_qa(qa_id)
        if not result:
            raise HTTPException(status_code=404, detail="Qa not found")
        return {"success": True, "data": {"deleted": True}}
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"success": False, "message": "Internal server error", "error": str(e)}
        )

@qas.get("/article/{article_id}")
async def get_qa_by_article_id(article_id: str):
    try:
        qas = await get_qa_by_article_id_service(article_id)
        # Service now always returns a list (empty if no QAs found)
        return {"success": True, "data": qas}
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"success": False, "message": "Internal server error", "error": str(e)}
        )    

# @qas.post("/{qa_id}/grade")
# async def grade(qa_id: str, qa: dict):
#     try:
#         result = await service_grade_qa(qa_id, qa)
#         if not result:
#             raise HTTPException(status_code=404, detail="Qa not found")
#         return {"success": True, "data": result}
#     except HTTPException:
#         raise
#     except Exception as e:
#         return JSONResponse(
#             status_code=500, 
#             content={"success": False, "message": "Internal server error", "error": str(e)}
#         )
        

