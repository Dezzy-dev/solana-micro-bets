# Solana CLI Installation Script for Windows
# This script downloads and installs Solana CLI tools

Write-Host "Installing Solana CLI..." -ForegroundColor Green

# Download the installer
$installerUrl = "https://release.solana.com/stable/install"
$tempFile = "$env:TEMP\solana-install.sh"

try {
    Write-Host "Downloading Solana installer..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $installerUrl -OutFile $tempFile -UseBasicParsing
    
    Write-Host "`nTo complete installation, you have two options:" -ForegroundColor Cyan
    Write-Host "`nOption 1 (Recommended): Use Git Bash or WSL" -ForegroundColor Yellow
    Write-Host "  Run: bash $tempFile" -ForegroundColor White
    Write-Host "`nOption 2: Manual Installation" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://github.com/solana-labs/solana/releases" -ForegroundColor White
    Write-Host "  2. Extract and add to PATH" -ForegroundColor White
    Write-Host "`nOption 3: Use Chocolatey (if installed)" -ForegroundColor Yellow
    Write-Host "  Run: choco install solana" -ForegroundColor White
    
} catch {
    Write-Host "Error downloading installer: $_" -ForegroundColor Red
    Write-Host "`nPlease install manually:" -ForegroundColor Yellow
    Write-Host "1. Visit: https://docs.solana.com/cli/install-solana-cli-tools" -ForegroundColor White
    Write-Host "2. Or use: choco install solana (if Chocolatey is installed)" -ForegroundColor White
}

