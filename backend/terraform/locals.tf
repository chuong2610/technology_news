# locals.tf
# File này định nghĩa các giá trị cục bộ (local values)
# Local values giúp tính toán và tái sử dụng các giá trị phức tạp

locals {
  # Tạo prefix chung cho tên tài nguyên
  # Ví dụ: question-app-dev
  resource_prefix = "${var.project_name}-${var.environment}"
  
  # Tên Resource Group
  resource_group_name = "${local.resource_prefix}-rg"
  
  # Tên App Service Plan
  app_service_plan_name = "${local.resource_prefix}-asp"
  
  # Tên App Service
  app_service_name = "${local.resource_prefix}-app"
  
  # Tên Cosmos DB Account
  cosmos_account_name = "${local.resource_prefix}-cosmos"
  
  # Tên Cosmos Database
  cosmos_database_name = "QuestionDb"
  
  # Tên Cosmos Container
  cosmos_container_name = "Questions"
  
  # Application Insights name
  app_insights_name = "${local.resource_prefix}-ai"
  
  # Kết hợp tags từ variable với environment tag
  tags = merge(var.common_tags, {
    Environment = var.environment
    Location    = var.location
  })
}
