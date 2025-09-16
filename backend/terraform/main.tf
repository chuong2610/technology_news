# main.tf
# File chính chứa định nghĩa các tài nguyên Azure

# Random string để đảm bảo tên tài nguyên duy nhất toàn cầu
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# Resource Group - nhóm chứa tất cả tài nguyên
resource "azurerm_resource_group" "main" {
  name     = local.resource_group_name
  location = var.location
  tags     = local.tags
}

# Application Insights - để monitoring và logging
resource "azurerm_application_insights" "main" {
  name                = local.app_insights_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type    = "web"  # Loại ứng dụng web
  
  tags = local.tags
}

# App Service Plan - định nghĩa tài nguyên compute cho web app
resource "azurerm_service_plan" "main" {
  name                = local.app_service_plan_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  
  # OS cho App Service (Linux)
  os_type = "Linux"
  
  # SKU định nghĩa cấu hình phần cứng và giá
  sku_name = var.app_service_plan_sku
  
  tags = local.tags
}

# Linux Web App - ứng dụng Python chạy trên Linux
resource "azurerm_linux_web_app" "main" {
  name                = "${local.app_service_name}-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_service_plan.main.location
  service_plan_id     = azurerm_service_plan.main.id
  
  # Cấu hình site
  site_config {
    # Luôn bật (không tự động tắt khi không có traffic)
    always_on = false  # false cho Basic tier
    
    # Cấu hình Python runtime
    application_stack {
      python_version = "3.11"  # Phiên bản Python
    }
    
    # Startup command để chạy ứng dụng
    app_command_line = "python -m uvicorn main:app --host 0.0.0.0 --port 8000"
  }
  
  # Cấu hình application settings (biến môi trường)
  app_settings = {
    # Application Insights
    "APPINSIGHTS_INSTRUMENTATIONKEY"        = azurerm_application_insights.main.instrumentation_key
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.main.connection_string
    
    # Cosmos DB settings
    "COSMOS_ENDPOINT"   = azurerm_cosmosdb_account.main.endpoint
    "COSMOS_KEY"        = azurerm_cosmosdb_account.main.primary_key
    "COSMOS_DB"         = azurerm_cosmosdb_sql_database.main.name
    "COSMOS_QUESTIONS"  = azurerm_cosmosdb_sql_container.questions.name
    
    # Python settings
    "PYTHONPATH"                      = "/home/site/wwwroot"
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "true"
  }
  
  # Kết nối với Application Insights
  logs {
    detailed_error_messages = true
    failed_request_tracing  = true
    
    application_logs {
      file_system_level = "Information"
    }
    
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }
  
  tags = local.tags
}

# Cosmos DB Account - tài khoản database NoSQL
resource "azurerm_cosmosdb_account" "main" {
  name                = "${local.cosmos_account_name}-${random_string.suffix.result}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  
  # Loại API (SQL API cho document database)
  offer_type   = "Standard"
  kind         = "GlobalDocumentDB"
  
  # Cấu hình consistency (tính nhất quán dữ liệu)
  consistency_policy {
    consistency_level       = var.cosmos_consistency_level
    max_interval_in_seconds = 300    # Chỉ dùng cho BoundedStaleness
    max_staleness_prefix    = 100000 # Chỉ dùng cho BoundedStaleness
  }
  
  # Vùng địa lý (có thể có nhiều vùng cho high availability)
  geo_location {
    location          = var.location
    failover_priority = 0  # Vùng chính
  }
  
  # Cấu hình bảo mật
  capabilities {
    name = "EnableServerless"  # Serverless mode - chỉ trả tiền khi sử dụng
  }
  
  tags = local.tags
}

# Cosmos Database - database logic trong Cosmos account
resource "azurerm_cosmosdb_sql_database" "main" {
  name                = local.cosmos_database_name
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  
  # Không cần throughput setting cho serverless
}

# Cosmos Container - container (tương đương table) để lưu questions
resource "azurerm_cosmosdb_sql_container" "questions" {
  name                  = local.cosmos_container_name
  resource_group_name   = azurerm_resource_group.main.name
  account_name          = azurerm_cosmosdb_account.main.name
  database_name         = azurerm_cosmosdb_sql_database.main.name
  
  # Partition key - cách Cosmos DB phân chia dữ liệu
  partition_key_path    = "/id"
  partition_key_version = 1
  
  # Không cần throughput setting cho serverless
}
