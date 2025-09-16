# variables.tf
# File này định nghĩa các biến đầu vào cho Terraform
# Biến giúp làm cho code linh hoạt và có thể tái sử dụng

# Tên dự án - được sử dụng để đặt tên các tài nguyên
variable "project_name" {
  description = "Tên dự án, sẽ được sử dụng để đặt tên các tài nguyên Azure"
  type        = string
  default     = "question-app"
  
  # Validation để đảm bảo tên tuân thủ quy tắc Azure
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Tên dự án chỉ được chứa chữ thường, số và dấu gạch ngang."
  }
}

# Vùng Azure để deploy
variable "location" {
  description = "Vùng Azure để triển khai tài nguyên (ví dụ: East Asia, Southeast Asia)"
  type        = string
  default     = "Southeast Asia"  # Singapore - gần Việt Nam nhất
}

# Environment (môi trường triển khai)
variable "environment" {
  description = "Môi trường triển khai (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment phải là một trong: dev, staging, prod."
  }
}

# App Service Plan SKU (cấu hình phần cứng)
variable "app_service_plan_sku" {
  description = "SKU cho App Service Plan (B1 = Basic, S1 = Standard, P1v2 = Premium)"
  type        = string
  default     = "B1"  # Basic tier - phù hợp cho development
}

# Cosmos DB consistency level
variable "cosmos_consistency_level" {
  description = "Mức độ nhất quán cho Cosmos DB"
  type        = string
  default     = "Session"  # Cân bằng giữa hiệu năng và tính nhất quán
  
  validation {
    condition = contains([
      "BoundedStaleness", 
      "Eventual", 
      "Session", 
      "Strong", 
      "ConsistentPrefix"
    ], var.cosmos_consistency_level)
    error_message = "Consistency level phải là một trong các giá trị hợp lệ."
  }
}

# Tags chung cho tất cả tài nguyên
variable "common_tags" {
  description = "Tags chung được áp dụng cho tất cả tài nguyên"
  type        = map(string)
  default = {
    Project     = "Question App"
    ManagedBy   = "Terraform"
    Owner       = "Development Team"
  }
}
