
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from backend.service.news_service import fetch_and_process_news
from backend.service.redis_article_service import redis_article_service
from typing import Optional
from datetime import datetime

news = APIRouter(prefix="/api/news", tags=["News"])

@news.get("")
async def get_news():
    """Fetch and process new articles from news sources"""
    news = await fetch_and_process_news()
    redis_article_service.save_pending_articles(news)
    return news

@news.get("/pending")
async def get_pending_articles(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Number of items per page"),
    date: Optional[str] = Query(None, description="Date to filter articles (YYYY-MM-DD)")
):
    """Get pending articles from Redis cache"""
    try:
        pending_articles = redis_article_service.get_pending_articles()

        if not pending_articles:
            return {
                "success": True,
                "data": {
                    "items": [],
                    "total": 0,
                    "page": page,
                    "limit": limit,
                    "total_pages": 0
                },
                "message": f"No pending articles found for date {date}"
            }

        # Calculate pagination
        total = len(pending_articles)
        total_pages = (total + limit - 1) // limit
        start = (page - 1) * limit
        end = start + limit

        # Get paginated items
        paginated_items = pending_articles[start:end]


        return {
            "success": True,
            "data": {
                "items": paginated_items,
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": total_pages
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get pending articles: {str(e)}")
    
@news.delete("/{id}")
async def delete_pending_article(id: str):
    print(f"🗑️ Backend: Received delete request for article ID: {id}")
    try:
        success = redis_article_service.delete_one_pending_article(id)
        print(f"📝 Backend: Redis delete result: {success}")
        if not success:
            print(f"❌ Backend: Article not found in Redis: {id}")
            raise HTTPException(status_code=404, detail="Article not found")
        print(f"✅ Backend: Article deleted successfully: {id}")
        return {"success": True, "message": "Article deleted successfully"}
    except Exception as e:
        print(f"❌ Backend: Failed to delete article {id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete article: {str(e)}")
    
