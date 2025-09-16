# Dockerfile
# Multi-stage build để tối ưu kích thước image

# Stage 1: Build stage
FROM python:3.11-slim as builder

# Thiết lập working directory
WORKDIR /app

# Cài đặt system dependencies cho build
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements và cài đặt Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Production stage
FROM python:3.11-slim

# Tạo user non-root cho security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Thiết lập working directory
WORKDIR /app

# Copy Python packages từ builder stage
COPY --from=builder /root/.local /home/appuser/.local

# Copy application code
COPY --chown=appuser:appuser . .

# Thiết lập PATH để include user-installed packages
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONPATH=/app

# Chuyển sang user non-root
USER appuser

# Expose port 8000 (port mặc định của uvicorn)
EXPOSE 8000

# Health check để kiểm tra container health
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Command để chạy ứng dụng
# Sử dụng uvicorn với cấu hình production
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
