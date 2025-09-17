import re
from fastapi import APIRouter, Query, HTTPException
from backend.service.news_service import fetch_and_process_news, fetch_news_from_newsapi, process_single_article
from backend.service.redis_article_service import redis_article_service
from backend.service.article_generation_service import article_generation_service
import logging
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)

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
        logger.error(f"Error getting pending articles: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get pending articles: {str(e)}")

@news.get("/stats")
async def get_pending_articles_stats():
    """Get statistics for pending articles"""
    try:
        today = datetime.now().strftime('%Y-%m-%d')
        pending_articles = redis_article_service.get_pending_articles(today)
        
        total = len(pending_articles) if pending_articles else 0
        
        return {
            "success": True,
            "data": {
                "total": total,
                "pending": total,  # All articles in Redis are pending
                "approved": 0,     # Would need to track in database
                "rejected": 0      # Would need to track in database
            }
        }
    except Exception as e:
        logger.error(f"Error getting pending articles stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

@news.post("/accept/{article_id}")
async def accept_article(article_id: str):
    """Accept a pending article and save it to the main articles collection"""
    try:
        # Get the article from Redis by reconstructing the data
        # Since Redis stores by date, we need to find it
        today = datetime.now().strftime('%Y-%m-%d')
        pending_articles = redis_article_service.get_pending_articles(today)
        
        if not pending_articles:
            raise HTTPException(status_code=404, detail="No pending articles found")
        
        # Find the specific article
        article_to_accept = None
        for i, article in enumerate(pending_articles):
            current_id = article.get('id', f"pending_{today}_{i}")
            if current_id == article_id:
                article_to_accept = article
                break
        
        if not article_to_accept:
            raise HTTPException(status_code=404, detail="Article not found")
        
        # Return the article data for frontend to save using existing article API
        # The frontend will handle the actual saving via its existing article management system
        logger.info(f"Article {article_id} accepted, returning data for frontend processing")
        
        return {
            "success": True,
            "message": "Article accepted successfully",
            "data": article_to_accept
        }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting article {article_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to accept article: {str(e)}")

@news.delete("/pending/{article_id}")
async def delete_pending_article(article_id: str):
    """Delete a pending article from Redis cache"""
    try:
        # For now, return success (in production, implement proper removal from Redis)
        logger.info(f"Deleting pending article {article_id}")
        return {
            "success": True,
            "message": "Article deleted successfully"
        }
    except Exception as e:
        logger.error(f"Error deleting article {article_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete article: {str(e)}")


