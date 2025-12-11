# 📱 Configuration avec Partage de Connexion (Hotspot)

## 🎯 Avantages du Hotspot

- ✅ Contourne toutes les restrictions du WiFi de l'école
- ✅ Réseau privé simple, pas d'AP Isolation
- ✅ Les deux appareils peuvent communiquer directement
- ✅ Pas besoin de tunnel ou publication
- ✅ Configuration simple

## 📋 Étapes de Configuration

### Étape 1 : Activer le Hotspot sur votre téléphone

**Android :**
1. Paramètres → Connexions → Point d'accès et partage de connexion
2. Activer "Point d'accès mobile"
3. Noter le nom du réseau (SSID) et le mot de passe

**iPhone :**
1. Réglages → Partage de connexion
2. Activer "Partage de connexion"
3. Noter le mot de passe affiché

### Étape 2 : Connecter les deux ordinateurs au Hotspot

**Sur votre ordinateur (hôte) :**
1. Se connecter au WiFi du hotspot de votre téléphone
2. Attendre d'obtenir une IP

**Sur l'ordinateur de l'autre joueur :**
1. Se connecter au même hotspot WiFi
2. Attendre d'obtenir une IP

### Étape 3 : Trouver votre IP sur le Hotspot

**Sur votre ordinateur (hôte) :**
```powershell
ipconfig | Select-String "IPv4"
```

Vous devriez voir une IP comme `192.168.43.x` ou `192.168.137.x` (selon le téléphone)

**Exemple :** `192.168.43.123`

### Étape 4 : Lancer les serveurs

**Terminal 1 - Backend :**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend :**
```bash
cd frontend
npm run dev
```

### Étape 5 : Configurer le pare-feu (une seule fois)

Autoriser les connexions entrantes :

```powershell
# Autoriser le port 3001 (Backend)
New-NetFirewallRule -DisplayName "Tetris Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow

# Autoriser le port 5173 (Frontend)
New-NetFirewallRule -DisplayName "Tetris Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

### Étape 6 : Jouer !

**Sur votre ordinateur :**
- Accéder à : http://localhost:5173

**Sur l'ordinateur de l'autre joueur :**
- Accéder à : **http://VOTRE_IP:5173**
- (Remplacer VOTRE_IP par l'IP que vous avez trouvée à l'étape 3)

## 🔍 Trouver rapidement votre IP

Créez un petit script pour afficher votre IP facilement :

```powershell
# Afficher uniquement l'IP du hotspot
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" } | Select-Object IPAddress
```

## ⚠️ Points importants

### 1. Consommation de données
- Le hotspot utilise les données mobiles
- Pour un jeu local, la consommation est minime
- Mais attention si vous avez un forfait limité !

### 2. Batterie du téléphone
- Le hotspot consomme beaucoup de batterie
- Gardez le téléphone branché si possible
- Ou assurez-vous d'avoir assez de batterie

### 3. Stabilité de la connexion
- La connexion peut être moins stable qu'un WiFi fixe
- Si ça lag, vérifiez le signal du téléphone

### 4. IP qui change
- L'IP peut changer si vous vous reconnectez
- Vérifiez l'IP à chaque fois avec `ipconfig`

## 🎮 Exemple concret

**Scénario :**
- Votre IP sur le hotspot : `192.168.43.123`
- Vous créez une session : Code `ABC123`

**Sur votre ordinateur :**
- http://localhost:5173
- Créer une session → Code `ABC123`

**Sur l'ordinateur de l'autre joueur :**
- http://192.168.43.123:5173
- Rejoindre → Entrer `ABC123`
- Jouer ! 🎉

## 🐛 Dépannage

### "Cannot connect"
- Vérifiez que les deux sont sur le même hotspot
- Vérifiez que le pare-feu autorise les connexions
- Vérifiez l'IP avec `ipconfig`

### "Connection refused"
- Vérifiez que les serveurs sont bien lancés
- Vérifiez que vous utilisez la bonne IP
- Essayez de ping : `ping 192.168.43.123`

### IP change souvent
- C'est normal, vérifiez à chaque fois avec `ipconfig`
- Ou configurez une IP statique dans les paramètres réseau Windows

## 💡 Astuce : Script pour afficher l'IP rapidement

Créez un fichier `show-ip.ps1` :

```powershell
Write-Host "=== Votre IP sur le Hotspot ===" -ForegroundColor Green
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -like "192.168.*" -and 
    $_.IPAddress -notlike "192.168.0.*" 
} | ForEach-Object {
    Write-Host "Frontend: http://$($_.IPAddress):5173" -ForegroundColor Cyan
    Write-Host "Backend:  http://$($_.IPAddress):3001" -ForegroundColor Cyan
}
```

Lancez-le avec : `.\show-ip.ps1`

