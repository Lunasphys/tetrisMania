# 🏫 Guide pour jouer sur le réseau WiFi de l'école

## ⚠️ Problèmes potentiels sur les réseaux d'école

Les réseaux WiFi d'école ont souvent des restrictions de sécurité qui peuvent empêcher les connexions directes entre appareils :

### 1. **AP Isolation (Isolation des points d'accès)**
- Les appareils ne peuvent pas communiquer directement entre eux
- Chaque appareil ne peut communiquer qu'avec le routeur/Internet
- **Résultat** : Les connexions peer-to-peer sont bloquées

### 2. **Pare-feu réseau**
- Bloque les ports non standards (3001, 5173)
- Filtre les connexions entrantes
- **Résultat** : Impossible de se connecter au serveur

### 3. **NAT strict**
- Les appareils sont derrière un NAT qui empêche les connexions directes
- **Résultat** : Besoin d'un tunnel ou d'une publication

## ✅ Comment tester si ça fonctionne

### Test 1 : Vérifier la connectivité réseau

**Sur votre ordinateur (hôte) :**
1. Lancer le backend et frontend
2. Noter votre IP locale (ex: `10.15.4.44`)

**Sur l'ordinateur de l'autre joueur :**
```powershell
# Tester la connexion au backend
Test-NetConnection -ComputerName 10.15.4.44 -Port 3001

# Tester la connexion au frontend
Test-NetConnection -ComputerName 10.15.4.44 -Port 5173
```

Si les tests échouent → Le réseau bloque les connexions

### Test 2 : Ping entre les deux appareils

**Sur l'ordinateur de l'autre joueur :**
```powershell
ping 10.15.4.44
```

Si le ping échoue → AP Isolation activé (pas de communication directe)

## 🔧 Solutions de contournement

### Solution 1 : Utiliser un tunnel (Recommandé pour l'école)

#### Option A : ngrok (Gratuit, simple)

1. **Installer ngrok** : https://ngrok.com/download

2. **Créer un compte gratuit** : https://dashboard.ngrok.com/signup

3. **Lancer vos serveurs localement :**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

4. **Créer un tunnel pour le backend :**
```bash
ngrok http 3001
```
Vous obtiendrez une URL comme : `https://abc123.ngrok.io`

5. **Créer un tunnel pour le frontend :**
```bash
# Nouveau terminal
ngrok http 5173
```
Vous obtiendrez une URL comme : `https://xyz789.ngrok.io`

6. **Modifier `frontend/.env` temporairement :**
```env
VITE_API_URL=https://abc123.ngrok.io
VITE_SOCKET_URL=https://abc123.ngrok.io
```

7. **Redémarrer le frontend** et partager l'URL ngrok du frontend avec l'autre joueur

⚠️ **Note** : Les URLs ngrok gratuites changent à chaque redémarrage. Pour une URL fixe, il faut un compte payant.

#### Option B : Cloudflare Tunnel (Gratuit, URL fixe)

1. Installer `cloudflared` : https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

2. Créer un tunnel :
```bash
cloudflared tunnel --url http://localhost:5173
```

3. Partager l'URL fournie (elle reste stable)

### Solution 2 : Publication en ligne (Meilleure pour l'école)

#### Frontend sur Vercel (Gratuit, 2 minutes)

1. **Installer Vercel CLI :**
```bash
npm i -g vercel
```

2. **Dans le dossier frontend :**
```bash
cd frontend
vercel
```

3. **Suivre les instructions** (très simple)

4. **Vous obtiendrez une URL** : `https://tetris-mania.vercel.app`

5. **Modifier `frontend/.env` pour production :**
```env
VITE_API_URL=https://votre-backend.railway.app
VITE_SOCKET_URL=https://votre-backend.railway.app
```

#### Backend sur Railway (Gratuit avec limites)

1. **Créer un compte** : https://railway.app

2. **Connecter votre repo GitHub**

3. **Déployer le backend**

4. **Configurer les variables d'environnement** dans Railway

### Solution 3 : Hotspot mobile (Si autorisé)

Si le WiFi de l'école bloque tout :
1. Créer un hotspot WiFi avec votre téléphone
2. Les deux se connectent au hotspot
3. Utiliser la méthode réseau local normale

## 🎯 Recommandation pour l'école

**Meilleure option : Publication en ligne**
- ✅ Fonctionne toujours, même avec restrictions réseau
- ✅ Pas besoin de configuration réseau
- ✅ URL simple à partager
- ✅ Gratuit avec Vercel + Railway

**Deuxième option : Tunnel ngrok**
- ✅ Rapide à mettre en place
- ✅ Fonctionne derrière les pare-feu
- ❌ URL change à chaque fois (gratuit)
- ❌ Nécessite ngrok installé

**Dernière option : Réseau local**
- ✅ Pas besoin de services externes
- ❌ Probablement bloqué par AP Isolation
- ❌ Peut ne pas fonctionner du tout

## 🧪 Test rapide

**Pour savoir rapidement si le réseau local fonctionne :**

1. Vous : Lancer backend + frontend
2. Vous : Noter votre IP (`ipconfig`)
3. L'autre : Essayer d'accéder à `http://VOTRE_IP:5173`
4. Si ça ne charge pas → Utiliser un tunnel ou publier

## 📝 Checklist avant de jouer à l'école

- [ ] Tester la connexion réseau entre les deux appareils
- [ ] Si échec → Préparer un tunnel (ngrok) ou publication
- [ ] Avoir les URLs de tunnel/publication prêtes
- [ ] Tester que tout fonctionne avant le cours ! 😄

