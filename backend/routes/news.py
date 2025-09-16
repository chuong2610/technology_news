import re
from fastapi import APIRouter, Query
from backend.service.news_service import fetch_and_process_news, fetch_news_from_newsapi, process_single_article
from backend.service.redis_article_service import redis_article_service
import logging

logger = logging.getLogger(__name__)

news = APIRouter(prefix="/api/news", tags=["News"])

@news.get("/")
async def get_news():
    news = await fetch_and_process_news()
    redis_article_service.save_pending_articles(news)
    return news


