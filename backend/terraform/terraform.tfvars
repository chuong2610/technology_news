# terraform.tfvars
# File này chứa giá trị cụ thể cho các biến
# Bạn có thể thay đổi các giá trị này theo nhu cầu

# Tên dự án của bạn
project_name = "question-app"

# Vùng Azure (chọn vùng gần nhất với người dùng)
# Southeast Asia = Singapore (gần Việt Nam nhất)
# East Asia = Hong Kong
location = "Southeast Asia"

# Môi trường (dev/staging/prod)
environment = "dev"

# Cấu hình App Service Plan
# B1 = Basic (1 core, 1.75GB RAM) - khoảng $13/tháng
# S1 = Standard (1 core, 1.75GB RAM) - khoảng $70/tháng (có auto-scaling)
# P1v2 = Premium (1 core, 3.5GB RAM) - khoảng $146/tháng (hiệu năng cao)
app_service_plan_sku = "B1"

# Mức nhất quán Cosmos DB
# Session = đọc write của session luôn nhất quán (khuyến nghị)
# Eventual = hiệu năng cao nhất, có thể đọc dữ liệu cũ
# Strong = nhất quán mạnh nhất, hiệu năng thấp hơn
cosmos_consistency_level = "Session"

# Tags cho tài nguyên
common_tags = {
  Project     = "Question Management App"
  ManagedBy   = "Terraform"
  Owner       = "Development Team"
  Environment = "Development"
  CostCenter  = "IT-Development"
}
