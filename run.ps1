# Determine paths
$CandidatePaths = @(
    (Join-Path $PSScriptRoot ".venv\Scripts\python.exe"),
    (Join-Path (Get-Item -Path $PSScriptRoot).Parent.FullName ".venv\Scripts\python.exe"),
    (Join-Path (Get-Item -Path "..").FullName ".venv\Scripts\python.exe")
)

$PythonPath = $null
foreach ($cand in $CandidatePaths) {
    if (Test-Path $cand) {
        $PythonPath = $cand
        break
    }
}

if (-not $PythonPath) {
    Write-Host "Error: Could not find virtual environment Python in $CandidatePaths" -ForegroundColor Red
    Exit 1
}

Write-Host "Found Python interpreter at: $PythonPath" -ForegroundColor Green

# 1. Start FastAPI Backend in a new window so you can see request logs (without --reload to prevent Windows PyTorch crashes)
Write-Host "Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Cyan
Start-Process -FilePath $PythonPath -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000" -WorkingDirectory (Join-Path $PSScriptRoot "backend")

# Wait a moment for PyTorch model loading
Write-Host "Waiting 3 seconds for model loading..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 2. Start Vite React Frontend
Write-Host "Starting Vite React Frontend on http://localhost:5173..." -ForegroundColor Cyan
Set-Location -Path (Join-Path $PSScriptRoot "frontend")
npm run dev
