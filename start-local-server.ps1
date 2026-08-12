$ErrorActionPreference = "Stop"

Write-Host "WorldProject: PostgreSQL + API werden gestartet..." -ForegroundColor Cyan

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker wurde nicht gefunden. Bitte Docker Desktop installieren und starten." -ForegroundColor Red
    exit 1
}

docker compose up -d --build

Write-Host ""
Write-Host "Warte auf die API..." -ForegroundColor Yellow
for ($i = 0; $i -lt 40; $i++) {
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 2
        if ($r.success) {
            Write-Host "WorldProject API + PostgreSQL laufen." -ForegroundColor Green
            Write-Host "Frontend weiter mit VS Code Live Server auf http://127.0.0.1:5500 starten." -ForegroundColor Green
            exit 0
        }
    } catch {}
    Start-Sleep -Seconds 2
}

Write-Host "API wurde nicht rechtzeitig bereit. Mit 'docker compose logs api postgres' kannst du die Logs ansehen." -ForegroundColor Red
exit 1
