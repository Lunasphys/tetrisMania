# 🌐 Configuration pour jouer en local (même réseau)

## 📋 Prérequis

- Les deux joueurs doivent être sur le **même réseau Wi-Fi/LAN**
- Le pare-feu Windows doit autoriser les connexions sur les ports 3001 et 5173

## 🔧 Configuration

### Étape 1 : Trouver votre IP locale

Votre IP Wi-Fi est : **10.15.4.44**

Pour vérifier votre IP :
```powershell
ipconfig | Select-String "IPv4"
```

### Étape 2 : Configurer le pare-feu Windows

Autoriser les ports dans le pare-feu :

```powershell
# Autoriser le port 3001 (Backend)
New-NetFirewallRule -DisplayName "Tetris Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow

# Autoriser le port 5173 (Frontend)
New-NetFirewallRule -DisplayName "Tetris Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

Ou manuellement :
1. Ouvrir "Pare-feu Windows Defender"
2. Paramètres avancés
3. Règles de trafic entrant > Nouvelle règle
4. Port > TCP > Ports spécifiques : 3001 et 5173
5. Autoriser la connexion

### Étape 3 : Lancer les serveurs

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

### Étape 4 : Accès depuis un autre appareil

**Sur votre ordinateur (hôte) :**
- Accéder à : http://localhost:5173

**Sur l'ordinateur de l'autre joueur (même réseau) :**
- Accéder à : **http://10.15.4.44:5173**

⚠️ **Important** : L'autre joueur doit utiliser votre IP locale (10.15.4.44) et non localhost !

## 🔄 Alternative : Créer un fichier .env.local pour le réseau

Si vous voulez que l'autre joueur utilise automatiquement votre IP, créez `frontend/.env.local` :

```env
VITE_SUPABASE_URL=https://xzygerdvxxapvkoevdmy.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
VITE_API_URL=http://10.15.4.44:3001
VITE_SOCKET_URL=http://10.15.4.44:3001
```

Mais attention : vous devrez modifier ce fichier à chaque fois que votre IP change.

## 🚀 Option 2 : Publier en ligne (plus simple)

Pour jouer avec quelqu'un à distance ou sans configuration réseau :

### Backend (Hébergement)
- **Railway** : https://railway.app
- **Render** : https://render.com
- **Heroku** : https://heroku.com

### Frontend (Hébergement)
- **Vercel** : https://vercel.com (gratuit, très simple)
- **Netlify** : https://netlify.com (gratuit)
- **GitHub Pages** : Gratuit mais statique uniquement

### Avantages de la publication
- ✅ Accessible depuis n'importe où
- ✅ Pas de configuration réseau
- ✅ URL simple à partager
- ✅ Pas de problème de pare-feu

### Inconvénients
- ❌ Nécessite un compte sur une plateforme
- ❌ Configuration de déploiement
- ❌ Les clés Supabase sont publiques (mais c'est normal avec l'anon key)

## 🎮 Comment jouer ensemble

1. **Vous (hôte)** : Créez une session de jeu
2. **Notez le code de session** (ex: ABC123)
3. **L'autre joueur** : 
   - Accède à http://10.15.4.44:5173 (ou votre URL publiée)
   - Clique sur "Join Game"
   - Entre le code de session
4. **C'est parti !** 🎉

## 🐛 Dépannage

### "Cannot connect to server"
- Vérifiez que les deux appareils sont sur le même réseau
- Vérifiez que le pare-feu autorise les connexions
- Vérifiez que les serveurs sont bien lancés

### "Connection refused"
- Vérifiez que vous utilisez la bonne IP (10.15.4.44)
- Vérifiez que les ports 3001 et 5173 ne sont pas utilisés par autre chose

### IP change souvent ?
- Configurez une IP statique dans les paramètres réseau Windows
- Ou utilisez un service de publication (Vercel, Netlify)

