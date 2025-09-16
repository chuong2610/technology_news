# routes/article_generation.py
# Router for article generation endpoints
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
from pydantic import BaseModel

# Import service functions
from backend.service.article_generation_service import (
    generate_article_from_input,
    get_article_suggestions_from_query
)

class ArticleGenerationRequest(BaseModel):
    query: str
    input_text: Optional[str] = ""
    article_type: Optional[str] = "informative"
    length: Optional[str] = "medium"
    tone: Optional[str] = "professional"
    output_format: Optional[str] = "markdown"

class ArticleSuggestionsRequest(BaseModel):
    query: str

# Create router for article generation endpoints
article_generation = APIRouter(prefix="/api/article-generation", tags=["Article Generation"])

@article_generation.post("/generate")
async def generate_article(request: ArticleGenerationRequest):
    """Generate an article based on user input"""
    try:
        result = await generate_article_from_input(
            query=request.query,
            input_text=request.input_text,
            article_type=request.article_type,
            length=request.length,
            tone=request.tone,
            output_format=request.output_format
        )
        
        if result["success"]:
            # Return the result directly since it already contains the article data
            return {
                "success": True, 
                "data": {
                    "title": result["title"],
                    "abstract": result["abstract"],
                    "content": result["content"],
                    "tags": result["tags"]
                },
                "message": result.get("message", "Article generated successfully")
            }
        else:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": result["message"], "error": result.get("error")}
            )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Internal server error", "error": str(e)}
        )

@article_generation.post("/suggestions")
async def get_article_suggestions(request: ArticleSuggestionsRequest):
    """Get article topic suggestions based on a query"""
    try:
        result = await get_article_suggestions_from_query(request.query)
        
        if result["success"]:
            return {"success": True, "data": result["data"]}
        else:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": result["message"], "error": result.get("error")}
            )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Internal server error", "error": str(e)}
        )

@article_generation.get("/config")
async def get_generation_config():
    """Get available configuration options for article generation"""
    try:
        config = {
            "article_types": ["informative", "tutorial", "opinion", "review", "news"],
            "lengths": ["short", "medium", "long"],
            "tones": ["professional", "casual", "academic", "conversational", "technical"],
            "output_formats": ["markdown", "html"],
            "length_descriptions": {
                "short": "300-600 words (quick read)",
                "medium": "600-1200 words (comprehensive)",
                "long": "1200-2500 words (in-depth)"
            },
            "tone_descriptions": {
                "professional": "Formal, authoritative, business-appropriate",
                "casual": "Friendly, conversational, approachable",
                "academic": "Scholarly, research-focused, detailed",
                "conversational": "Personal, engaging, friendly",
                "technical": "Precise, detailed, industry-specific"
            }
        }
        return {"success": True, "data": config}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Internal server error", "error": str(e)}
        )
