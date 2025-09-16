# provider.tf
# File này định nghĩa các nhà cung cấp dịch vụ (providers) mà Terraform sử dụng
# Provider là plugin cho phép Terraform tương tác với các dịch vụ cloud như Azure

terraform {
  # Phiên bản Terraform tối thiểu cần thiết
  required_version = ">= 1.0"
  
  # Danh sách các provider cần thiết
  required_providers {
    # Azure Resource Manager provider - để tạo và quản lý tài nguyên Azure
    azurerm = {
      source  = "hashicorp/azurerm"  # Nguồn tải provider
      version = "~> 3.0"             # Phiên bản provider (3.x.x)
    }
    
    # Random provider - để tạo các giá trị ngẫu nhiên (như tên tài nguyên duy nhất)
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

# Cấu hình Azure provider
provider "azurerm" {
  # Bật các tính năng mới (bắt buộc từ phiên bản 2.0+)
  features {
    # Cấu hình cho Resource Group
    resource_group {
      # Tự động xóa khi resource group bị xóa
      prevent_deletion_if_contains_resources = false
    }
    
    # Cấu hình cho App Service
    app_service {
      # Tự động phục hồi soft-deleted app service
      retrieve_app_settings_during_plan = true
    }
  }
}

# Random provider không cần cấu hình thêm
provider "random" {}
