# Script de demarrage rapide pour Tetris Mania
Write-Host "Tetris Mania - Demarrage Rapide" -ForegroundColor Cyan
Write-Host ""

# Verifier si on est dans le bon dossier
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "Erreur: Ce script doit etre lance depuis la racine du projet" -ForegroundColor Red
    exit 1
}

# Afficher l'IP actuelle
Write-Host "Votre IP sur le reseau:" -ForegroundColor Yellow
$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"
} | Select-Object -First 1

if ($ips) {
    $yourIP = $ips.IPAddress
    Write-Host "Frontend: http://$yourIP:5173" -ForegroundColor Green
    Write-Host "Backend:  http://$yourIP:3001" -ForegroundColor Green
    Write-Host ""
    Write-Host "L'autre joueur doit utiliser: http://$yourIP:5173" -ForegroundColor Cyan
} else {
    Write-Host "Aucune IP locale trouvee. Connectez-vous au hotspot d'abord!" -ForegroundColor Yellow
}
Write-Host ""

# Verifier le pare-feu
Write-Host "Verification du pare-feu..." -ForegroundColor Yellow
$backendRule = Get-NetFirewallRule -DisplayName "Tetris Backend" -ErrorAction SilentlyContinue
$frontendRule = Get-NetFirewallRule -DisplayName "Tetris Frontend" -ErrorAction SilentlyContinue

if (-not $backendRule -or -not $frontendRule) {
    Write-Host "Les regles de pare-feu ne sont pas configurees" -ForegroundColor Yellow
    Write-Host "Executez ces commandes en Administrateur:" -ForegroundColor Yellow
    Write-Host "New-NetFirewallRule -DisplayName 'Tetris Backend' -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow" -ForegroundColor Cyan
    Write-Host "New-NetFirewallRule -DisplayName 'Tetris Frontend' -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "Pare-feu configure" -ForegroundColor Green
    Write-Host ""
}

# Instructions
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Terminal 1 - Backend:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Terminal 2 - Frontend:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Ouvrez votre navigateur:" -ForegroundColor White
Write-Host "   http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "4. L'autre joueur ouvre:" -ForegroundColor White
if ($ips) {
    Write-Host ('   http://' + $yourIP + ':5173') -ForegroundColor Green
} else {
    Write-Host "   http://VOTRE_IP:5173" -ForegroundColor Green
}
Write-Host ""
