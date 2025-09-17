import asyncio
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.executors.asyncio import AsyncIOExecutor 

from backend.service.news_service import fetch_and_process_news
from backend.service.redis_article_service import redis_article_service

logger = logging.getLogger(__name__)

class NewsSchedulerService:
    def __init__(self):
        self.scheduler = None
        self._setup_scheduler()
    
    def _setup_scheduler(self):
        """Initialize the async scheduler"""
        try:
            executors = {
                'default': AsyncIOExecutor(),
            }
            
            job_defaults = {
                'coalesce': True,  # Combine multiple instances of the same job
                'max_instances': 1,  # Only one instance of the job can run at a time
                'misfire_grace_time': 300  # 5 minutes grace time for misfired jobs
            }
            
            self.scheduler = AsyncIOScheduler(
                executors=executors,
                job_defaults=job_defaults,
                timezone='UTC'
            )
            
            logger.info("News scheduler initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize scheduler: {e}")
            self.scheduler = None
    
    async def fetch_and_save_news(self):
        try:
            start_time = datetime.now(timezone.utc)
            logger.info(f"🕐 Starting scheduled news fetch at {start_time}")
            
            # Fetch and process news articles
            processed_articles = await fetch_and_process_news()
            
            if not processed_articles:
                logger.warning("No articles fetched during scheduled run")
                return
            
            # Save all articles as a single batch to Redis
            redis_article_service.save_pending_articles(processed_articles)
            
        except Exception as e:
            logger.error(f"❌ Error in scheduled news fetch: {e}")
    
    def start_scheduler(self):
        """Start the background scheduler"""
        if not self.scheduler:
            logger.error("Scheduler not initialized")
            return False
        
        try:
            self.scheduler.add_job(
            self.fetch_and_save_news,
            trigger=CronTrigger(hour=1, minute=12, timezone='UTC'),
            id='fetch_news_job',
            name='Fetch News Daily at 06:00 UTC',
            replace_existing=True
)
        
            
            # Start the scheduler
            self.scheduler.start()
            
            logger.info("🚀 News scheduler started")
            logger.info("   📅 News fetching: every 6 hours")
            logger.info("   🧹 Cleanup: every 24 hours")
            
            # Run once immediately for testing (optional)
            # asyncio.create_task(self.fetch_and_save_news())
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to start scheduler: {e}")
            return False
    
    def stop_scheduler(self):
        if self.scheduler and self.scheduler.running:
            try:
                self.scheduler.shutdown(wait=True)
                logger.info("News scheduler stopped")
                return True
            except Exception as e:
                logger.error(f"Error stopping scheduler: {e}")
                return False
        return True
    
    def trigger_immediate_fetch(self):
        """Trigger an immediate news fetch (for testing/manual trigger)"""
        if not self.scheduler or not self.scheduler.running:
            logger.error("Scheduler is not running")
            return False
        
        try:
            # Add a one-time job to run immediately
            self.scheduler.add_job(
                self.fetch_and_save_news,
                trigger='date',
                id='immediate_fetch',
                name='Immediate News Fetch',
                replace_existing=True
            )
            
            logger.info("🔄 Immediate news fetch triggered")
            return True
            
        except Exception as e:
            logger.error(f"Error triggering immediate fetch: {e}")
            return False

# Global scheduler service instance
news_scheduler_service = NewsSchedulerService()

# Startup and shutdown functions for FastAPI
async def start_scheduler():
    success = news_scheduler_service.start_scheduler()
    if success:
        logger.info("✅ Background news scheduler started successfully")
    else:
        logger.error("❌ Failed to start background news scheduler")

async def stop_scheduler():
    success = news_scheduler_service.stop_scheduler()
    if success:
        logger.info("✅ Background news scheduler stopped successfully")
    else:
        logger.error("❌ Failed to stop background news scheduler")