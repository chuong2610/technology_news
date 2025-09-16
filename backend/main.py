# main.py
# File chính của ứng dụng FastAPI
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Import các module của ứng dụng
from backend.database.cosmos import connect_cosmos, close_cosmos
from backend.routes.qa_generation import qa_generation
from backend.routes.article_generation import article_generation
from backend.routes.qa import qas
from backend.routes.qa_result import qas_result
from backend.routes.news import news
from backend.service.scheduler_service import start_scheduler, stop_scheduler


# Lifecycle manager - quản lý khởi tạo và đóng kết nối
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Kết nối database khi ứng dụng khởi động
    print("🚀 Starting Question App...")
    await connect_cosmos()
    
    # Start the news scheduler
    await start_scheduler()
    
    yield
    
    # Shutdown: Đóng kết nối khi ứng dụng tắt
    print("🛑 Shutting down Question App...")
    
    # Stop the news scheduler
    await stop_scheduler()
    
    await close_cosmos()


# Tạo FastAPI app với lifecycle manager
app = FastAPI(
    title="Question Management API",
    description="API để quản lý câu hỏi sử dụng Azure Cosmos DB",
    version="1.0.0",
    lifespan=lifespan
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "*").split(",")

# Cấu hình CORS (Cross-Origin Resource Sharing)
# Cho phép frontend từ domain khác gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_URL,  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Đăng ký routes
app.include_router(qas)
app.include_router(qa_generation)
app.include_router(article_generation)
app.include_router(qas_result)
app.include_router(news)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Endpoint kiểm tra sức khỏe ứng dụng"""
    return {"status": "healthy", "message": "Question App is running"}



# Chạy ứng dụng (chỉ khi chạy trực tiếp file này)
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload khi code thay đổi (chỉ dùng trong development)
        log_level="info"
    )