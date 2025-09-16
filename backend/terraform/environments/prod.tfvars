# terraform/environments/prod.tfvars
# Cấu hình cho môi trường production

# Thông tin dự án
project_name = "question-app"
environment  = "prod"

# Vị trí địa lý
location = "Southeast Asia"  # Singapore

# Cấu hình App Service cho production
app_service_plan_sku = "S1"  # Standard với auto-scaling

# Cosmos DB settings cho production
cosmos_consistency_level = "Session"  # Optimal cho production

# Tags cho production
common_tags = {
  Project     = "Question Management App"
  Environment = "Production"
  ManagedBy   = "Terraform"
  Owner       = "Operations Team"
  CostCenter  = "Production"
  Purpose     = "Live Application"
  Backup      = "Required"
  Monitoring  = "Required"
}
