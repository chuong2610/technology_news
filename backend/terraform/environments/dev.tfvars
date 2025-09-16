# terraform/environments/dev.tfvars
# Cấu hình cho môi trường development

# Thông tin dự án
project_name = "question-app"
environment  = "dev"

# Vị trí địa lý
location = "Southeast Asia"  # Singapore - gần Việt Nam

# Cấu hình App Service cho development
app_service_plan_sku = "B1"  # Basic - rẻ nhất cho dev

# Cosmos DB settings cho development
cosmos_consistency_level = "Session"  # Cân bằng performance và consistency

# Tags cho development
common_tags = {
  Project     = "Question Management App"
  Environment = "Development"
  ManagedBy   = "Terraform"
  Owner       = "Dev Team"
  CostCenter  = "Development"
  Purpose     = "Learning and Testing"
}
