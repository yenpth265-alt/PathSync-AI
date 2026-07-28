Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "     PathSync-AI - Starting Up...        " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "[ERROR] Docker is not running! Please start Docker Desktop first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[1/2] Building & starting all services..." -ForegroundColor Yellow
docker compose up --build -d

Write-Host ""
Write-Host "[2/2] Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  ALL SERVICES RUNNING!                  " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Open your browser and go to:" -ForegroundColor White
Write-Host ""
Write-Host "  >>> http://localhost:5173 <<<" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press Ctrl+C or run 'docker compose down' to stop." -ForegroundColor Gray
Write-Host ""

Start-Process "http://localhost:5173"
