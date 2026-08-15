$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Server = Join-Path $Root "server"

Write-Host "ORVUNO: lokaler HERE-Verkehrsdienst wird gestartet..." -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js wurde nicht gefunden." -ForegroundColor Red
    exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "npm wurde nicht gefunden." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path (Join-Path $Root ".env"))) {
    Write-Host "Die lokale .env-Datei fehlt. Dort muss HERE_API_KEY eingetragen sein." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path (Join-Path $Server "node_modules"))) {
    Write-Host "Einmalige Vorbereitung: Server-Pakete werden installiert..." -ForegroundColor Yellow
    Push-Location $Server
    try { npm install } finally { Pop-Location }
}

try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:3002/health" -TimeoutSec 1
    if ($health.success) {
        Write-Host "HERE-Verkehrsdienst läuft bereits auf Port 3002." -ForegroundColor Green
        Write-Host "Frontend weiter mit VS Code Live Server auf http://127.0.0.1:5500 starten." -ForegroundColor Green
        exit 0
    }
} catch {}

$command = "Set-Location -LiteralPath '$Server'; npm run traffic"
Start-Process powershell -ArgumentList @('-NoExit','-ExecutionPolicy','Bypass','-Command',$command)

Write-Host "Warte auf den HERE-Verkehrsdienst..." -ForegroundColor Yellow
for ($i = 0; $i -lt 30; $i++) {
    try {
        $r = Invoke-RestMethod -Uri "http://127.0.0.1:3002/health" -TimeoutSec 1
        if ($r.success) {
            if ($r.hereConfigured) {
                Write-Host "ORVUNO HERE-Verkehr läuft und der API-Key wurde geladen." -ForegroundColor Green
            } else {
                Write-Host "Dienst läuft, aber HERE_API_KEY wurde nicht geladen." -ForegroundColor Red
                exit 1
            }
            Write-Host "Kein Docker und keine lokale PostgreSQL-Datenbank für den Verkehrstest nötig." -ForegroundColor Green
            Write-Host "Frontend weiter mit VS Code Live Server auf http://127.0.0.1:5500 starten." -ForegroundColor Green
            exit 0
        }
    } catch {}
    Start-Sleep -Seconds 1
}

Write-Host "HERE-Verkehrsdienst wurde nicht rechtzeitig bereit. Bitte das neu geöffnete PowerShell-Fenster prüfen." -ForegroundColor Red
exit 1
