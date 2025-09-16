# Question Management API - Azure Deployment

🚀 **Ứng dụng quản lý câu hỏi sử dụng FastAPI và Azure Cosmos DB**

## 📋 Tổng quan

Đây là một REST API được xây dựng bằng Python FastAPI để quản lý câu hỏi, được triển khai trên Azure App Service với Cosmos DB làm database. Dự án sử dụng Terraform để quản lý infrastructure as code.

### ✨ Tính năng chính
- ✅ CRUD operations cho questions
- ✅ Tìm kiếm questions theo keyword
- ✅ Phân loại questions theo category  
- ✅ RESTful API với OpenAPI documentation
- ✅ Health checks và monitoring
- ✅ Auto-scaling trên Azure
- ✅ Infrastructure as Code với Terraform

### 🏗️ Kiến trúc

```
Frontend/Client
       ↓
Azure App Service (FastAPI)
       ↓
Azure Cosmos DB (NoSQL)
       ↓
Application Insights (Monitoring)
```

## 📁 Cấu trúc dự án

```
question/
├── 📂 terraform/              # Infrastructure as Code
│   ├── provider.tf           # Azure provider configuration
│   ├── variables.tf          # Input variables
│   ├── main.tf              # Main resources
│   ├── outputs.tf           # Output values
│   ├── locals.tf            # Local computed values
│   ├── terraform.tfvars     # Variable values
│   └── 📂 environments/      # Environment-specific configs
│       ├── dev.tfvars       # Development settings
│       └── prod.tfvars      # Production settings
│
├── 📂 database/              # Database layer
│   ├── __init__.py
│   └── cosmos.py            # Cosmos DB connection & config
│
├── 📂 repository/            # Data access layer
│   ├── __init__.py
│   └── question_repo.py     # Repository pattern implementation
│
├── 📂 service/               # Business logic layer
│   ├── __init__.py
│   └── question_service.py  # Business logic for questions
│
├── 📂 routes/                # API endpoints
│   ├── __init__.py
│   └── question.py          # Question CRUD endpoints
│
├── 📂 monitoring/            # Health checks & monitoring
│   ├── __init__.py
│   └── health_check.py      # Health check endpoints
│
├── 📂 config/                # Configuration management
│   ├── __init__.py
│   └── settings.py          # Centralized settings
│
├── main.py                  # FastAPI application entry point
├── requirements.txt         # Python dependencies
├── Dockerfile              # Container configuration
├── deploy.ps1              # Automated deployment script
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── DEPLOYMENT.md           # Detailed deployment guide
└── README.md               # This file
```

## 🛠️ Công nghệ sử dụng

### Backend
- **Python 3.11** - Ngôn ngữ lập trình
- **FastAPI** - Modern web framework 
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **Azure Cosmos DB SDK** - Database client

### Infrastructure  
- **Azure App Service** - Web hosting
- **Azure Cosmos DB** - NoSQL database
- **Application Insights** - Monitoring
- **Terraform** - Infrastructure as Code
- **Azure CLI** - Command line tools

## 📋 Yêu cầu hệ thống

### Phần mềm cần thiết
- **Windows 10/11** với PowerShell
- **Azure CLI** - Để tương tác với Azure
- **Terraform** - Để quản lý infrastructure
- **Python 3.11+** - Để development local (optional)

### Tài khoản Azure
- Subscription Azure với quyền Contributor
- Đủ quota cho App Service và Cosmos DB

## 🚀 Hướng dẫn cài đặt nhanh

### 1. Cài đặt công cụ

```powershell
# Cài đặt Azure CLI
winget install Microsoft.AzureCLI

# Cài đặt Terraform  
winget install HashiCorp.Terraform

# Restart PowerShell để update PATH
```

### 2. Clone và setup dự án

```powershell
# Clone repository (nếu có)
git clone [repository-url]
cd question

# Hoặc download và extract ZIP file
```

### 3. Cấu hình deployment

```powershell
# Copy và chỉnh sửa file cấu hình
copy terraform\terraform.tfvars terraform\my-config.tfvars

# Chỉnh sửa các giá trị trong my-config.tfvars:
# - project_name: tên dự án của bạn
# - location: vùng Azure (mặc định: Southeast Asia)
# - environment: dev/staging/prod
```

### 4. Deploy bằng script tự động

```powershell
# Đăng nhập Azure
az login

# Deploy với script tự động
.\deploy.ps1 -Environment dev -ProjectName "my-question-app"

# Hoặc deploy manual
cd terraform
terraform init
terraform plan -var-file="environments\dev.tfvars"
terraform apply -var-file="environments\dev.tfvars"
```

### 5. Kiểm tra kết quả

```powershell
# Lấy URL ứng dụng
cd terraform  
terraform output app_service_url

# Mở API documentation
start "$(terraform output -raw app_service_url)/docs"
```

## 🧪 Test API

### Health Check
```bash
GET /api/health
```

### Question Operations  
```bash
# Lấy tất cả questions
GET /api/questions/

# Lấy question theo ID
GET /api/questions/{id}

# Tạo question mới
POST /api/questions/
{
  "id": "q1",
  "title": "Câu hỏi test",
  "content": "Nội dung câu hỏi",
  "category": "general",
  "tags": ["test", "demo"]
}

# Cập nhật question
PUT /api/questions/{id}
{
  "title": "Tiêu đề mới"
}

# Xóa question
DELETE /api/questions/{id}

# Tìm kiếm questions
GET /api/questions/search?keyword=test

# Lấy questions theo category
GET /api/questions/category/general
```

## 📊 Monitoring & Logging

### Application Insights
- **Live Metrics**: Real-time performance
- **Application Map**: Dependency visualization  
- **Failures**: Error tracking
- **Performance**: Response time analysis

### Health Endpoints
- `/api/health` - Basic health check
- `/api/health/detailed` - Includes database connectivity
- `/api/metrics` - Application metrics
- `/api/ready` - Readiness probe

### Logs Access
```powershell
# Via Azure CLI
az webapp log tail --name [app-name] --resource-group [rg-name]

# Via Azure Portal
Portal → App Services → [your-app] → Log stream
```

## 💰 Chi phí ước tính

### Development (B1 tier)
- App Service Plan B1: **~$13/tháng**
- Cosmos DB Serverless: **~$0.25/1M requests**
- Application Insights: **Free tier (5GB)**
- **Tổng: ~$15-20/tháng**

### Production (S1 tier)  
- App Service Plan S1: **~$70/tháng**
- Cosmos DB: **Tùy usage**
- Application Insights: **$2.3/GB**
- **Tổng: ~$75-100/tháng**

## 🔧 Development Local

### Setup environment
```powershell
# Tạo virtual environment
python -m venv venv
venv\Scripts\Activate.ps1

# Cài đặt dependencies
pip install -r requirements.txt

# Copy và setup environment variables
copy .env.example .env
# Chỉnh sửa .env với Cosmos DB credentials
```

### Chạy local
```powershell
# Start application
python main.py

# Hoặc với uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# API docs: http://localhost:8000/docs
```

## 🛡️ Security Best Practices

### Implemented
- ✅ Environment variables cho secrets
- ✅ Input validation với Pydantic
- ✅ CORS configuration
- ✅ Non-root container user
- ✅ Health checks

### Recommended for Production
- 🔲 Azure Key Vault integration
- 🔲 Azure AD authentication
- 🔲 API rate limiting
- 🔲 Network security groups
- 🔲 SSL/TLS termination

## 🔄 CI/CD Pipeline (Future)

### GitHub Actions Example
```yaml
name: Deploy to Azure
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Terraform
      uses: hashicorp/setup-terraform@v1
    - name: Deploy Infrastructure  
      run: terraform apply -auto-approve
```

## 🆘 Troubleshooting

### Common Issues

#### ❌ "Authentication failed"
```powershell
# Solution: Re-login to Azure
az login
az account set --subscription [subscription-id]
```

#### ❌ "Resource name already exists"
```powershell
# Solution: Change project_name in terraform.tfvars
project_name = "my-unique-name-123"
```

#### ❌ "App not starting"
```powershell
# Check logs
az webapp log tail --name [app-name] --resource-group [rg-name]

# Check environment variables
az webapp config appsettings list --name [app-name] --resource-group [rg-name]
```

#### ❌ "Database connection error"
```powershell
# Verify Cosmos DB settings in Azure Portal
# Check app settings contain correct COSMOS_ENDPOINT and COSMOS_KEY
```

## 🗑️ Cleanup Resources

```powershell
# Destroy all resources
.\deploy.ps1 -DestroyOnly

# Or manual cleanup
cd terraform
terraform destroy -auto-approve
```

## 📚 Tài liệu tham khảo

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Azure Cosmos DB Python SDK](https://docs.microsoft.com/en-us/azure/cosmos-db/sql/python-quickstart)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)

## 👥 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`  
5. Submit Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

- 📧 Email: [your-email@domain.com]
- 💬 Issues: GitHub Issues
- 📖 Documentation: DEPLOYMENT.md

---

**Made with ❤️ for learning Azure deployment with Terraform**
