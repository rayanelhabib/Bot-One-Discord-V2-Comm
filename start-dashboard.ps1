# One Tap Bot Dashboard Launcher
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "    ONE TAP BOT DASHBOARD LAUNCHER" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SERVER_PORT = 3001
$CLIENT_PORT = 3000

# Arreter les processus Node.js existants
Write-Host "Arret des processus Node.js existants..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Demarrer le serveur backend
Write-Host "Demarrage du serveur backend (port $SERVER_PORT)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-Command", "cd src/web/server; npm install; npm start" -WindowStyle Minimized
Start-Sleep -Seconds 8

# Demarrer le client React
Write-Host "Demarrage du client React (port $CLIENT_PORT)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-Command", "cd src/web/client; npm install; npm start" -WindowStyle Minimized
Start-Sleep -Seconds 15

# Verifier les ports
Write-Host "Verification des ports..." -ForegroundColor Green
$port3000 = netstat -an | findstr ":3000"
$port3001 = netstat -an | findstr ":3001"

if ($port3000) {
    Write-Host "OK - Client React demarre sur le port 3000" -ForegroundColor Green
} else {
    Write-Host "ERREUR - Client React non detecte sur le port 3000" -ForegroundColor Red
}

if ($port3001) {
    Write-Host "OK - Serveur backend demarre sur le port 3001" -ForegroundColor Green
} else {
    Write-Host "ERREUR - Serveur backend non detecte sur le port 3001" -ForegroundColor Red
}

Write-Host ""
Write-Host "Dashboard lance !" -ForegroundColor Green
Write-Host "Interface web: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API backend: http://localhost:3001/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur une touche pour fermer ce script..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
