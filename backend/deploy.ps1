# deploy.ps1
# PowerShell script để tự động hóa quá trình deployment

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectName = "question-app",
    
    [Parameter(Mandatory=$false)]
    [switch]$DestroyOnly = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipAppDeploy = $false
)

# Màu sắc cho output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $Reset)
    Write-Host "$Color$Message$Reset"
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "🚀 $Message" $Blue
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" $Green
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" $Red
}

# Kiểm tra prerequisites
function Test-Prerequisites {
    Write-Step "Kiểm tra các công cụ cần thiết..."
    
    # Kiểm tra Azure CLI
    try {
        az --version | Out-Null
        Write-Success "Azure CLI: OK"
    }
    catch {
        Write-Error "Azure CLI chưa được cài đặt hoặc không trong PATH"
        exit 1
    }
    
    # Kiểm tra Terraform
    try {
        terraform --version | Out-Null
        Write-Success "Terraform: OK"
    }
    catch {
        Write-Error "Terraform chưa được cài đặt hoặc không trong PATH"
        exit 1
    }
    
    # Kiểm tra đăng nhập Azure
    $loginCheck = az account show 2>$null
    if (-not $loginCheck) {
        Write-Warning "Chưa đăng nhập Azure. Đang thực hiện đăng nhập..."
        az login
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Đăng nhập Azure thất bại"
            exit 1
        }
    }
    else {
        Write-Success "Azure Login: OK"
    }
}

# Deploy infrastructure với Terraform
function Deploy-Infrastructure {
    Write-Step "Triển khai infrastructure với Terraform..."
    
    Push-Location "terraform"
    
    try {
        # Initialize Terraform
        Write-Step "Khởi tạo Terraform..."
        terraform init
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Terraform init thất bại"
            return $false
        }
        
        # Validate configuration
        Write-Step "Kiểm tra cấu hình Terraform..."
        terraform validate
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Terraform validate thất bại"
            return $false
        }
        
        # Plan deployment
        Write-Step "Tạo kế hoạch deployment..."
        terraform plan -var="environment=$Environment" -var="project_name=$ProjectName" -out="tfplan"
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Terraform plan thất bại"
            return $false
        }
        
        # Apply deployment
        Write-Step "Triển khai infrastructure..."
        terraform apply "tfplan"
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Terraform apply thất bại"
            return $false
        }
        
        Write-Success "Infrastructure được triển khai thành công!"
        return $true
    }
    finally {
        Pop-Location
    }
}

# Deploy application code
function Deploy-Application {
    Write-Step "Triển khai application code..."
    
    Push-Location "terraform"
    
    try {
        # Lấy thông tin từ Terraform outputs
        $appName = terraform output -raw app_service_name
        $resourceGroup = terraform output -raw resource_group_name
        
        if (-not $appName -or -not $resourceGroup) {
            Write-Error "Không thể lấy thông tin App Service từ Terraform outputs"
            return $false
        }
        
        Pop-Location
        
        Write-Step "Chuẩn bị package deployment..."
        
        # Tạo danh sách files cần deploy (loại trừ không cần thiết)
        $excludePatterns = @(
            "terraform/*",
            ".git/*",
            "venv/*",
            "__pycache__/*",
            "*.pyc",
            ".env*",
            "deploy.ps1",
            "Dockerfile",
            "DEPLOYMENT.md",
            "*.md"
        )
        
        # Tạo temporary directory
        $tempDir = New-TemporaryFile | % { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
        
        try {
            # Copy files (loại trừ các pattern không cần thiết)
            Get-ChildItem -Path . -Recurse | Where-Object {
                $relativePath = $_.FullName.Replace((Get-Location).Path + "\", "")
                $shouldExclude = $false
                foreach ($pattern in $excludePatterns) {
                    if ($relativePath -like $pattern) {
                        $shouldExclude = $true
                        break
                    }
                }
                -not $shouldExclude
            } | ForEach-Object {
                $destPath = Join-Path $tempDir $_.FullName.Replace((Get-Location).Path, "")
                $destDir = Split-Path $destPath -Parent
                if (-not (Test-Path $destDir)) {
                    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
                }
                Copy-Item $_.FullName $destPath -Force
            }
            
            # Tạo ZIP file
            $zipPath = "deploy.zip"
            if (Test-Path $zipPath) {
                Remove-Item $zipPath -Force
            }
            
            Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force
            
            Write-Step "Uploading application code..."
            
            # Deploy lên Azure App Service
            az webapp deployment source config-zip --resource-group $resourceGroup --name $appName --src $zipPath
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Application code deployed thành công!"
                
                # Lấy URL của ứng dụng
                Push-Location "terraform"
                $appUrl = terraform output -raw app_service_url
                Pop-Location
                
                Write-Success "Ứng dụng đã sẵn sàng tại: $appUrl"
                return $true
            }
            else {
                Write-Error "Deploy application code thất bại"
                return $false
            }
        }
        finally {
            # Cleanup
            if (Test-Path $tempDir) {
                Remove-Item $tempDir -Recurse -Force
            }
            if (Test-Path $zipPath) {
                Remove-Item $zipPath -Force
            }
        }
    }
    catch {
        Write-Error "Lỗi trong quá trình deploy application: $_"
        return $false
    }
    finally {
        if ((Get-Location).Path.EndsWith("terraform")) {
            Pop-Location
        }
    }
}

# Destroy infrastructure
function Destroy-Infrastructure {
    Write-Step "Xóa infrastructure..."
    
    Push-Location "terraform"
    
    try {
        $confirmation = Read-Host "Bạn có chắc chắn muốn xóa tất cả tài nguyên? (yes/no)"
        if ($confirmation -eq "yes") {
            terraform destroy -var="environment=$Environment" -var="project_name=$ProjectName" -auto-approve
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Infrastructure đã được xóa thành công!"
            }
            else {
                Write-Error "Xóa infrastructure thất bại"
            }
        }
        else {
            Write-Warning "Hủy bỏ xóa infrastructure"
        }
    }
    finally {
        Pop-Location
    }
}

# Main execution
Write-ColorOutput @"
🚀 Azure Deployment Script
========================
Environment: $Environment
Project: $ProjectName
Destroy Only: $DestroyOnly
Skip App Deploy: $SkipAppDeploy
"@ $Blue

if ($DestroyOnly) {
    Test-Prerequisites
    Destroy-Infrastructure
    exit 0
}

# Normal deployment flow
Test-Prerequisites

$infraSuccess = Deploy-Infrastructure
if (-not $infraSuccess) {
    Write-Error "Infrastructure deployment thất bại. Dừng quá trình."
    exit 1
}

if (-not $SkipAppDeploy) {
    $appSuccess = Deploy-Application
    if (-not $appSuccess) {
        Write-Error "Application deployment thất bại."
        exit 1
    }
}

Write-Success @"
🎉 Deployment hoàn tất!

Để kiểm tra ứng dụng:
1. Mở Azure Portal và kiểm tra Resource Group: $ProjectName-$Environment-rg
2. Kiểm tra App Service logs
3. Truy cập ứng dụng qua URL được hiển thị ở trên

Để xóa tài nguyên:
.\deploy.ps1 -DestroyOnly
"@
