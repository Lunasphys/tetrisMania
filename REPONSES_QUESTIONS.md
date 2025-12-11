# Réponses à vos questions

## 1. Pourquoi je deviens spectateur quand je crée une session ?

**Problème identifié et corrigé !** 

Le problème était que :
- Le serveur générait un `playerId` lors de la création de session
- Le frontend générait un autre `playerId` différent
- Quand le WebSocket se connectait, le serveur ne reconnaissait pas ce `playerId` comme étant `player1`
- Donc il vous mettait en spectateur

**Solution appliquée :**
- Le serveur retourne maintenant le `playerId` lors de la création de session
- Le frontend utilise ce `playerId` pour la connexion WebSocket
- Vous serez maintenant correctement identifié comme `player1`

**Action requise :**
- Redémarrer le frontend (Ctrl+C puis `npm run dev`)
- Créer une nouvelle session
- Vous devriez maintenant être `player1` et non `spectator`

## 2. Est-ce que le .env doit être différent sur l'ordinateur du collègue ?

**NON, plus besoin !** ✅

Avec les corrections que j'ai faites, le frontend détecte automatiquement l'IP du serveur en fonction de l'URL utilisée :

- Si le collègue accède à `http://172.20.10.11:5173`
- Le frontend utilisera automatiquement `http://172.20.10.11:3001` pour l'API et le WebSocket
- Pas besoin de modifier le `.env` !

**Le .env peut rester identique sur les deux machines :**
```env
VITE_SUPABASE_URL=https://xzygerdvxxapvkoevdmy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

Le code détecte automatiquement si vous êtes sur `localhost` ou sur une IP réseau et ajuste les URLs en conséquence.

## Résumé des corrections

✅ Détection automatique de l'IP du serveur
✅ Correction du problème de rôle (player1 vs spectator)
✅ Pas besoin de modifier le .env sur l'ordinateur du collègue

