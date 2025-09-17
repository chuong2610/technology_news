"""
Redis Article Service

This service handles:
1. Storing pending articles in Redis for admin approval
2. Managing article approval workflow
3. Retrieving pending articles for admin review
"""

import json
import os
from re import S
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import redis
from backend.config.settings import SETTINGS
import logging

load_dotenv()

logger = logging.getLogger(__name__)

class RedisArticleService:
    def __init__(self):
        self.redis_client = None
        self._init_redis()
    
    def _init_redis(self):
        """Initialize Redis connection"""
        try:
            
            # Use from_url method
            self.redis_client = redis.from_url(
                SETTINGS.redis_url,
                password=SETTINGS.redis_password,
                db=SETTINGS.redis_db,
                decode_responses=True,
                socket_timeout=10,
                socket_connect_timeout=10,
                ssl_cert_reqs=None  
            )
            
            # Test connection
            self.redis_client.ping()
            logger.info("Redis connection established successfully")
            
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            print(f"=== Redis Connection Error ===")
            print(f"Error: {e}")
            self.redis_client = None
    
    def is_connected(self) -> bool:
        """Check if Redis connection is active"""
        try:
            if self.redis_client:
                self.redis_client.ping()
                return True
        except:
            pass
        return False
    
    def save_pending_articles(self, articles_data: List[Dict[str, Any]]) -> Optional[dict]:
        logger.info(f"save_pending_articles called with {len(articles_data)} articles")
        
        if not self.is_connected():
            logger.error("Redis not connected - cannot save articles")
            return None
        
        try:
            # Generate batch ID with timestamp
            today = datetime.now().strftime("%Y%m%d_%H%M%S")  # format: 20250916_143022
            
            # Prepare articles list for Redis
            redis_articles = []
            for article_data in articles_data:
                redis_article = {
                    "id": str(uuid.uuid4()),
                    "title": article_data.get("title", ""),
                    "abstract": article_data.get("abstract", ""),
                    "content": article_data.get("content", ""),
                    "tags": article_data.get("tags", []),  # Keep as list
                    "image_url": article_data.get("image", ""),
                }
                redis_articles.append(redis_article)
            
            today = datetime.now().strftime("%Y%m%d")  # dạng 20250916
            redis_key = f"pending_article:{today}"
            self.redis_client.set(redis_key, json.dumps(redis_articles, ensure_ascii=False))
            self.redis_client.expire(redis_key, 24 * 60 * 60)

            logger.info(f"Saved {len(redis_articles)} articles to Redis")
            return json.dumps(redis_articles, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error saving articles batch to Redis: {e}")
            return None

    def get_pending_articles(self) -> List[Dict[str, Any]]:
        if not self.is_connected():
            logger.error("Redis not connected")
            return []
        
        try:
            date = datetime.now().strftime("%Y%m%d")
            
            redis_key = f"pending_article:{date}"
            articles_json = self.redis_client.get(redis_key)
            
            if not articles_json:
                logger.info(f"No pending articles found for date {date}")
                return []
            
            try:
                articles = json.loads(articles_json)
                return articles
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing articles JSON for date {date}: {e}")
                return []
            
        except Exception as e:
            logger.error(f"Error retrieving pending articles: {e}")
            return []
        
    def delete_one_pending_article(self, article_id: str) -> bool:
        if not self.is_connected():
            logger.error("Redis not connected")
            return False
        
        try:
            redis_key = f"pending_article:{datetime.now().strftime('%Y%m%d')}"
            articles_json = self.redis_client.get(redis_key)
            
            if not articles_json:
                return False
            
            try:
                articles = json.loads(articles_json)
            except json.JSONDecodeError as e:
                return False
            updated_articles = [a for a in articles if a.get("id") != article_id]
            
            if len(updated_articles) == len(articles):
                return False
            
            self.redis_client.set(redis_key, json.dumps(updated_articles, ensure_ascii=False))
            self.redis_client.expire(redis_key, 24 * 60 * 60)
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting article: {e}")
            return False    

    # def get_all_pending_dates(self) -> List[str]:
    #     if not self.is_connected():
    #         logger.error("Redis not connected")
    #         return []
        
    #     try:
    #         keys = self.redis_client.keys("pending_article:*")
    #         dates = []
    #         for key in keys:
    #             if ":" in key:
    #                 date_part = key.split(":")[1]
    #                 dates.append(date_part)
            
    #         # Sort dates (newest first)
    #         dates.sort(reverse=True)
            
    #         logger.info(f"Found {len(dates)} dates with pending articles")
    #         return dates
            
    #     except Exception as e:
    #         logger.error(f"Error getting pending dates: {e}")
    #         return []



    


# Global service instance
redis_article_service = RedisArticleService()