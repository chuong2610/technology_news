# HƯỚNG DẪN TRIỂN KHAI ỨNG DỤNG PYTHON LÊN AZURE BẰNG TERRAFORM

## TỔNG QUAN KIẾN TRÚC

### Kiến trúc ứng dụng
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client/Web    │    │   Azure App      │    │   Azure Cosmos  │
│   Browser       │───▶│   Service        │───▶│   DB            │
│                 │    │   (Python/FastAPI)│    │   (NoSQL)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ Application     │
                       │ Insights        │
                       │ (Monitoring)    │
                       └─────────────────┘
```

### Các thành phần chính:

1. **Azure App Service**: Host ứng dụng Python FastAPI
2. **Azure Cosmos DB**: NoSQL database lưu trữ questions
3. **Application Insights**: Monitoring và logging
4. **Terraform**: Infrastructure as Code

## YÊU CẦU TRƯỚC KHI BẮT ĐẦU

### 1. Tài khoản và subscription Azure
- Tài khoản Azure active với quyền Contributor hoặc Owner
- Subscription với đủ quota cho các tài nguyên

### 2. Công cụ cần thiết
- **Azure CLI**: `winget install Microsoft.AzureCLI`
- **Terraform**: `winget install HashiCorp.Terraform`
- **PowerShell**: Có sẵn trên Windows
- **Git**: `winget install Git.Git` (optional)

### 3. Kiến thức cơ bản
- Hiểu biết cơ bản về Azure services
- Làm quen với command line
- Hiểu biết về Python và API

## CHI TIẾT CÁC FILE TERRAFORM

### 1. provider.tf - Cấu hình Provider
```hcl
terraform {
  required_version = ">= 1.0"          # Yêu cầu Terraform phiên bản 1.0+
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"    # Provider chính thức của Azure
      version = "~> 3.0"               # Sử dụng phiên bản 3.x.x
    }
  }
}

provider "azurerm" {
  features {}                          # Bật các features mới của provider
}
```

**Giải thích**: File này khai báo provider Azure và version requirements. Provider là plugin cho phép Terraform tương tác với Azure APIs.

### 2. variables.tf - Định nghĩa biến đầu vào
```hcl
variable "project_name" {
  description = "Tên dự án"
  type        = string
  default     = "question-app"
  
  validation {                         # Validate input format
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Tên dự án chỉ được chứa chữ thường, số và dấu gạch ngang."
  }
}
```

**Giải thích**: Variables cho phép tái sử dụng code với các giá trị khác nhau. Validation đảm bảo input đúng format.

### 3. locals.tf - Tính toán giá trị cục bộ
```hcl
locals {
  resource_prefix = "${var.project_name}-${var.environment}"    # question-app-dev
  resource_group_name = "${local.resource_prefix}-rg"          # question-app-dev-rg
}
```

**Giải thích**: Locals giúp tính toán và tái sử dụng các giá trị phức tạp, tránh lặp lại code.

### 4. main.tf - Tài nguyên chính

#### Resource Group
```hcl
resource "azurerm_resource_group" "main" {
  name     = local.resource_group_name      # Tên resource group
  location = var.location                   # Vùng địa lý (Southeast Asia)
  tags     = local.tags                     # Tags để quản lý
}
```
**Giải thích**: Resource Group là container chứa tất cả tài nguyên liên quan.

#### App Service Plan
```hcl
resource "azurerm_service_plan" "main" {
  name                = local.app_service_plan_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type            = "Linux"              # OS cho container
  sku_name           = var.app_service_plan_sku  # B1 = Basic tier
}
```
**Giải thích**: App Service Plan định nghĩa tài nguyên compute (CPU, RAM) cho web app.

#### Linux Web App
```hcl
resource "azurerm_linux_web_app" "main" {
  name                = "${local.app_service_name}-${random_string.suffix.result}"
  service_plan_id     = azurerm_service_plan.main.id
  
  site_config {
    application_stack {
      python_version = "3.11"             # Phiên bản Python
    }
    app_command_line = "python -m uvicorn main:app --host 0.0.0.0 --port 8000"
  }
  
  app_settings = {                        # Environment variables
    "COSMOS_ENDPOINT"   = azurerm_cosmosdb_account.main.endpoint
    "COSMOS_KEY"        = azurerm_cosmosdb_account.main.primary_key
  }
}
```
**Giải thích**: Web App chạy Python application với các cấu hình runtime và environment variables.

#### Cosmos DB Account
```hcl
resource "azurerm_cosmosdb_account" "main" {
  name                = "${local.cosmos_account_name}-${random_string.suffix.result}"
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"    # SQL API
  
  consistency_policy {
    consistency_level = var.cosmos_consistency_level  # Session level
  }
  
  geo_location {
    location          = var.location
    failover_priority = 0                   # Primary region
  }
  
  capabilities {
    name = "EnableServerless"               # Serverless mode - pay per use
  }
}
```
**Giải thích**: Cosmos DB Account là container cho databases. Serverless mode chỉ tính tiền khi sử dụng.

### 5. outputs.tf - Kết quả sau deployment
```hcl
output "app_service_url" {
  description = "URL của ứng dụng web"
  value       = "https://${azurerm_linux_web_app.main.default_hostname}"
}
```
**Giải thích**: Outputs trả về thông tin quan trọng sau khi deployment hoàn tất.

## CÁC BƯỚC DEPLOYMENT CHI TIẾT

### Bước 1: Chuẩn bị môi trường

#### 1.1. Kiểm tra công cụ đã cài đặt
```powershell
# Kiểm tra Azure CLI
az --version

# Kiểm tra Terraform  
terraform --version

# Nếu chưa có, cài đặt:
winget install Microsoft.AzureCLI
winget install HashiCorp.Terraform
```

#### 1.2. Đăng nhập Azure
```powershell
# Đăng nhập
az login

# Kiểm tra subscription hiện tại
az account show

# Chọn subscription (nếu có nhiều)
az account set --subscription "your-subscription-id"
```

### Bước 2: Khởi tạo Terraform

#### 2.1. Di chuyển vào thư mục terraform
```powershell
cd f:\dev\py\question\terraform
```

#### 2.2. Khởi tạo Terraform
```powershell
# Download providers và modules
terraform init
```
**Giải thích**: `terraform init` tải xuống Azure provider và tạo `.terraform` directory.

#### 2.3. Validate cấu hình
```powershell
# Kiểm tra syntax
terraform validate
```

#### 2.4. Format code (optional)
```powershell
# Format Terraform files
terraform fmt
```

### Bước 3: Plan và Apply

#### 3.1. Xem kế hoạch deployment
```powershell
# Tạo execution plan
terraform plan -var-file="environments/dev.tfvars"
```
**Giải thích**: `terraform plan` hiển thị những tài nguyên sẽ được tạo/sửa/xóa.

#### 3.2. Apply deployment
```powershell
# Deploy infrastructure
terraform apply -var-file="environments/dev.tfvars"
# Gõ 'yes' để xác nhận
```
**Giải thích**: `terraform apply` thực hiện tạo tài nguyên trên Azure.

### Bước 4: Deploy Application Code

#### 4.1. Lấy thông tin App Service
```powershell
# Lấy tên App Service từ Terraform output
$appName = terraform output -raw app_service_name
$resourceGroup = terraform output -raw resource_group_name
```

#### 4.2. Chuẩn bị code deployment
```powershell
# Quay về thư mục gốc
cd ..

# Tạo ZIP file (loại trừ các file không cần thiết)
$exclude = @("terraform", ".git", "venv", "__pycache__")
Compress-Archive -Path * -DestinationPath deploy.zip -Force -Exclude $exclude
```

#### 4.3. Deploy code lên Azure
```powershell
# Deploy ZIP file lên App Service
az webapp deployment source config-zip --resource-group $resourceGroup --name $appName --src deploy.zip
```

### Bước 5: Kiểm tra deployment

#### 5.1. Lấy URL ứng dụng
```powershell
# Quay về thư mục terraform
cd terraform

# Lấy URL ứng dụng
$appUrl = terraform output -raw app_service_url
Write-Host "Ứng dụng đã sẵn sàng tại: $appUrl"
```

#### 5.2. Test endpoints
```powershell
# Test health endpoint
Invoke-RestMethod -Uri "$appUrl/api/health"

# Test API documentation
Start-Process "$appUrl/docs"
```

## GIẢI THÍCH CHI TIẾT CODE PYTHON

### 1. main.py - Entry point của ứng dụng
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Kết nối database
    await connect_cosmos()
    yield
    # Shutdown: Đóng kết nối
    await close_cosmos()
```
**Giải thích**: Lifespan manager quản lý kết nối database trong lifecycle của app.

```python
app = FastAPI(
    title="Question Management API",
    lifespan=lifespan
)
```
**Giải thích**: Tạo FastAPI instance với metadata và lifecycle manager.

### 2. database/cosmos.py - Database connection
```python
client: CosmosClient = None
database = None  
questions = None
```
**Giải thích**: Module-level variables để cache kết nối database.

```python
async def connect_cosmos():
    global client, database, questions
    
    client = CosmosClient(ENDPOINT, credential=KEY)
    database = await client.create_database_if_not_exists(DATABASE_NAME)
    questions = await database.create_container_if_not_exists(
        id=QUESTIONS_CONTAINER,
        partition_key=PartitionKey(path="/id")
    )
```
**Giải thích**: Tạo kết nối và containers nếu chưa tồn tại.

### 3. routes/question.py - API endpoints
```python
@router.get("/", response_model=List[QuestionResponse])
async def get_all_questions():
    questions = await QuestionService.get_all_questions()
    return questions
```
**Giải thích**: GET endpoint trả về danh sách questions, sử dụng service layer.

```python
@router.post("/", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(question: QuestionCreate):
    question_data = question.dict()
    created_question = await QuestionService.create_question(question_data)
    return created_question
```
**Giải thích**: POST endpoint tạo question mới, validate input với Pydantic.

## MONITORING VÀ TROUBLESHOOTING

### 1. Xem logs trong Azure Portal
```
Portal → App Services → [your-app] → Log stream
```

### 2. Kiểm tra Application Insights
```
Portal → Application Insights → [your-ai] → Live Metrics
```

### 3. Debug với Azure CLI
```powershell
# Xem logs
az webapp log tail --name $appName --resource-group $resourceGroup

# Xem app settings
az webapp config appsettings list --name $appName --resource-group $resourceGroup

# Restart app
az webapp restart --name $appName --resource-group $resourceGroup
```

### 4. Common issues và solutions

#### Issue: App không start
**Giải pháp**: 
- Kiểm tra `app_command_line` trong Terraform
- Verify `requirements.txt` có đầy đủ dependencies
- Check logs trong Portal

#### Issue: Database connection error
**Giải pháp**:
- Verify `COSMOS_ENDPOINT` và `COSMOS_KEY` trong app settings
- Check Cosmos DB firewall settings
- Test connection với health endpoint

#### Issue: Slow performance
**Giải pháp**:
- Upgrade App Service Plan từ B1 lên S1 hoặc P1v2
- Optimize Cosmos DB queries
- Enable Application Insights profiling

## CHI PHÍ ƯỚC TÍNH

### Development Environment (B1 plan):
- **App Service Plan B1**: ~$13/tháng
- **Cosmos DB Serverless**: ~$0.25/1M requests + $0.25/GB storage
- **Application Insights**: $2.3/GB (5GB đầu tiên free)
- **Total**: ~$15-20/tháng

### Production Environment (S1 plan):
- **App Service Plan S1**: ~$70/tháng  
- **Cosmos DB Serverless**: Tùy usage
- **Application Insights**: Tùy log volume
- **Total**: ~$75-100/tháng

## AUTOMATION SCRIPT

Sử dụng script PowerShell để tự động hóa:

```powershell
# Deploy development environment
.\deploy.ps1 -Environment dev

# Deploy production environment  
.\deploy.ps1 -Environment prod

# Destroy resources
.\deploy.ps1 -DestroyOnly
```

## NEXT STEPS

### 1. Security enhancements:
- Implement Azure Key Vault cho secrets
- Configure Azure AD authentication
- Setup network security groups

### 2. CI/CD Pipeline:
- Azure DevOps hoặc GitHub Actions
- Automated testing
- Blue-green deployment

### 3. Scalability:
- Multiple regions deployment
- Auto-scaling configuration
- Load balancing

### 4. Monitoring:
- Custom dashboards
- Alerting rules
- Performance optimization
