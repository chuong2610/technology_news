# outputs.tf
# File này định nghĩa các giá trị output sau khi Terraform chạy xong
# Output giúp bạn lấy thông tin quan trọng về tài nguyên đã tạo

# URL của ứng dụng web
output "app_service_url" {
  description = "URL của ứng dụng web đã deploy"
  value       = "https://${azurerm_linux_web_app.main.default_hostname}"
}

# Tên App Service
output "app_service_name" {
  description = "Tên của App Service"
  value       = azurerm_linux_web_app.main.name
}

# Resource Group name
output "resource_group_name" {
  description = "Tên Resource Group chứa tất cả tài nguyên"
  value       = azurerm_resource_group.main.name
}

# Cosmos DB endpoint
output "cosmos_db_endpoint" {
  description = "Endpoint của Cosmos DB"
  value       = azurerm_cosmosdb_account.main.endpoint
}

# Cosmos DB primary key (sensitive - sẽ được ẩn)
output "cosmos_db_primary_key" {
  description = "Primary key của Cosmos DB"
  value       = azurerm_cosmosdb_account.main.primary_key
  sensitive   = true  # Ẩn giá trị này trong log
}

# Application Insights Instrumentation Key
output "app_insights_instrumentation_key" {
  description = "Instrumentation Key của Application Insights"
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}

# Application Insights Connection String
output "app_insights_connection_string" {
  description = "Connection String của Application Insights"
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}

# Cosmos Database name
output "cosmos_database_name" {
  description = "Tên database trong Cosmos DB"
  value       = azurerm_cosmosdb_sql_database.main.name
}

# Cosmos Container name
output "cosmos_container_name" {
  description = "Tên container trong Cosmos DB"
  value       = azurerm_cosmosdb_sql_container.questions.name
}

# Deployment summary
output "deployment_summary" {
  description = "Tóm tắt thông tin deployment"
  value = {
    app_url             = "https://${azurerm_linux_web_app.main.default_hostname}"
    resource_group      = azurerm_resource_group.main.name
    location           = azurerm_resource_group.main.location
    app_service_name   = azurerm_linux_web_app.main.name
    cosmos_account     = azurerm_cosmosdb_account.main.name
    cosmos_database    = azurerm_cosmosdb_sql_database.main.name
    cosmos_container   = azurerm_cosmosdb_sql_container.questions.name
  }
}
