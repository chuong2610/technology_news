"""
QA Generation API endpoints
Handles creation of QA tests from article content using AI
"""

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from typing import Optional
from pydantic import BaseModel, Field 

from backend.service.qa_generation_service import qa_generation_service
# from backend.utils import get_current_user
# from backend.enum.roles import Role

# Request/Response models
class QAGenerationRequest(BaseModel):
    """Request model for QA generation"""
    article_id: str = Field(..., description="Unique identifier for the article")
    title: Optional[str] = Field(None, description="Article title")
    abstract: Optional[str] = Field(None, description="Article abstract/summary")
    content: Optional[str] = Field(None, description="Full article content")
    num_questions: Optional[int] = Field(5, ge=3, le=10, description="Number of questions to generate (3-10)")

# Router setup
qa_generation = APIRouter(prefix="/api/qa-generation", tags=["QA Generation"])

@qa_generation.post("/")
async def generate_qa_test(
    request: QAGenerationRequest,
    #current_user: dict = Depends(get_current_user)
):
    """
    Generate QA test for a single article
    
    Requires article content (title, abstract, or content - at least one must be provided)
    Returns generated multiple-choice questions with explanations
    """
    try:
        # Validate user has permission (writers and admins can generate QA)
        # if current_user.get("role") not in [Role.WRITER.value, Role.ADMIN.value]:
        #     raise HTTPException(
        #         status_code=status.HTTP_403_FORBIDDEN,
        #         detail="Only writers and admins can generate QA tests"
        #     )
        
        # Validate input - at least one content field must be provided
        if not any([request.title, request.abstract, request.content]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one of title, abstract, or content must be provided"
            )
        
        # Log the generation request
        content_info = []
        if request.title:
            content_info.append(f"title({len(request.title)} chars)")
        if request.abstract:
            content_info.append(f"abstract({len(request.abstract)} chars)")
        if request.content:
            content_info.append(f"content({len(request.content)} chars)")
        
       # print(f"🎯 QA Generation requested by {current_user.get('full_name', 'Unknown')} for article {request.article_id}")
        print(f"   Content: {', '.join(content_info)}")
        print(f"   Questions: {request.num_questions}")
        
        # Generate QA test
        result = await qa_generation_service.generate_qa_test(
            article_id=request.article_id,
            title=request.title or "",
            abstract=request.abstract or "",
            content=request.content or "",
            num_questions=request.num_questions
        )
        
        if result.get('success'):
            print(f"✅ QA Generation successful: {result.get('questions_count', 0)} questions, method: {result.get('method_used', 'unknown')}")
            
            return {
                "success": True,
                "data": result.get('data'),
                "questions_count": result.get('questions_count'),
                "estimated_time_minutes": result.get('estimated_time_minutes'),
                "method_used": result.get('method_used'),
                "warning": result.get('warning')
            }
        else:
            print(f"❌ QA Generation failed: {result.get('error', 'Unknown error')}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"QA generation failed: {result.get('error', 'Unknown error')}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ QA Generation API error: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": f"Internal server error: {str(e)}",
                "data": None
            }
        )
        
        
        