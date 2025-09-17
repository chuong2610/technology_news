import re
from fastapi import APIRouter, Query, HTTPException
from backend.service.news_service import fetch_and_process_news, fetch_news_from_newsapi, process_single_article
from backend.service.redis_article_service import redis_article_service
from backend.service.article_generation_service import article_generation_service
from typing import Optional
from datetime import datetime

news = APIRouter(prefix="/api/news", tags=["News"])

@news.get("/")
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
        # If no date specified, use today
        if not date:
            date = datetime.now().strftime('%Y-%m-%d')
        
        # Get pending articles from Redis
        pending_articles = redis_article_service.get_pending_articles(date)
        
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
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        
        # Get paginated items
        paginated_items = pending_articles[start_idx:end_idx]
        
        # Add IDs and status if not present
        for i, article in enumerate(paginated_items):
            if 'id' not in article:
                article['id'] = f"pending_{date}_{start_idx + i}"
            if 'status' not in article:
                article['status'] = 'pending'
            if 'fetched_at' not in article:
                article['fetched_at'] = date
        
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
        print(f"Error getting pending articles: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get pending articles: {str(e)}")


@news.post("/accept/{article_id}")
async def accept_article(article_id: str):
    """Accept a pending article - Future Development"""
    print(f"Accept article function called for {article_id} - Future Development")
    return {
        "success": False,
        "message": "Accept article functionality is under development. This feature will be available in a future release.",
        "status": "future_development"
    }

@news.delete("/pending/{article_id}")
async def delete_pending_article(article_id: str):
    """Delete a pending article - Future Development"""
    print(f"Delete article function called for {article_id} - Future Development")
    return {
        "success": False,
        "message": "Delete article functionality is under development. This feature will be available in a future release.",
        "status": "future_development"
    }


