# run-dev.ps1 - helper to install deps and start frontend + backend (dev)
# Usage: Right-click -> "Run with PowerShell" or run in PowerShell: .\run-dev.ps1

# Change to script directory
Set-Location -Path (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent)

Write-Host "Installing root dependencies..."
npm install

Write-Host "Installing server dependencies..."
npm --prefix server install

Write-Host "Starting frontend + backend (dev)..."
# This command uses the npm script `dev:all` which runs both servers concurrently
npm run dev:all
