# 👥 Guide pour votre collègue

## ⚠️ Problème : "Failed to create session"

Si votre collègue obtient cette erreur, c'est parce que son navigateur essaie de se connecter au backend sur sa machine au lieu de la vôtre.

## ✅ Solution

### Option 1 : Modifier l'URL directement dans le navigateur (Rapide)

Quand votre collègue accède à `http://172.20.10.11:5173`, il doit :

1. **Ouvrir la console du navigateur** (F12)
2. **Aller dans l'onglet Console**
3. **Taper cette commande** :
```javascript
localStorage.setItem('API_URL', 'http://172.20.10.11:3001');
location.reload();
```

### Option 2 : Modifier le fichier .env (Si le collègue a le code)

Si votre collègue a accès au code source, il doit modifier `frontend/.env` :

```env
VITE_SUPABASE_URL=https://xzygerdvxxapvkoevdmy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eWdlcmR2eHhhcHZrb2V2ZG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDk3NTAsImV4cCI6MjA4MDk4NTc1MH0.se9L95GK7dvxKZoIaebypcbOrtG4BhR6vyslqVs3doU
VITE_API_URL=http://172.20.10.11:3001
VITE_SOCKET_URL=http://172.20.10.11:3001
```

**Important** : Remplacer `172.20.10.11` par votre IP actuelle !

Puis redémarrer le frontend :
```bash
cd frontend
npm run dev
```

### Option 3 : Solution automatique (Recommandé)

Modifier le code pour détecter automatiquement l'IP du serveur. Voir ci-dessous.

## 🔧 Solution automatique (Pour vous, l'hôte)

Je vais créer une solution qui détecte automatiquement l'IP du serveur.

