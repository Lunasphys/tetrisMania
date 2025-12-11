# 🚀 Démarrage Rapide - Hotspot

## 📱 Étape 1 : Activer le Hotspot

1. **Sur votre téléphone** : Activer le partage de connexion/hotspot
2. **Noter le nom du réseau et le mot de passe**
3. **Connecter votre ordinateur** au hotspot WiFi
4. **L'autre joueur se connecte aussi** au même hotspot

## 💻 Étape 2 : Trouver votre IP

Ouvrez PowerShell et tapez :

```powershell
ipconfig | Select-String "IPv4"
```

**Notez l'IP qui commence par `192.168.`** (ex: `192.168.43.123`)

## 🔥 Étape 3 : Autoriser le Pare-feu (une seule fois)

Ouvrez PowerShell en **Administrateur** et tapez :

```powershell
New-NetFirewallRule -DisplayName "Tetris Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Tetris Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

## 🎮 Étape 4 : Lancer l'Application

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

Attendez de voir :
```
🚀 Server running on http://localhost:3001
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Attendez de voir :
```
Local:   http://localhost:5173/
```

## 🎯 Étape 5 : Jouer !

### Sur votre ordinateur :
- Ouvrez : **http://localhost:5173**
- Créez une session → Notez le code (ex: `ABC123`)

### Sur l'ordinateur de l'autre joueur :
- Ouvrez : **http://VOTRE_IP:5173** (remplacer par votre IP de l'étape 2)
- Cliquez "Join Game"
- Entrez le code de session
- **C'est parti !** 🎉

## 📝 Checklist

- [ ] Hotspot activé sur le téléphone
- [ ] Les deux ordinateurs connectés au hotspot
- [ ] IP trouvée (192.168.x.x)
- [ ] Pare-feu configuré
- [ ] Backend lancé (port 3001)
- [ ] Frontend lancé (port 5173)
- [ ] Session créée
- [ ] Autre joueur rejoint avec le code

