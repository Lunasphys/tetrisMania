# 👨‍💻 Guide Développeur Frontend

Guide complet pour intégrer le backend Tetris Mania dans votre application frontend.

## 🚀 Démarrage Rapide

### 1. Configuration

Créez un fichier `.env` dans votre projet frontend :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

**Note:** Le code détecte automatiquement l'IP du serveur si vous accédez via une IP réseau (ex: `http://172.20.10.11:5173`), donc vous pouvez laisser `localhost` dans le `.env`.

### 2. Installation

```bash
npm install axios socket.io-client @supabase/supabase-js
```

### 3. Configuration API

```typescript
// config/api.ts
import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:3001') {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:3001`;
  }
  return 'http://localhost:3001';
};

export const api = axios.create({
  baseURL: `${getApiBaseUrl()}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('supabase.auth.token');
  if (token) {
    const parsed = JSON.parse(token);
    if (parsed?.access_token) {
      config.headers.Authorization = `Bearer ${parsed.access_token}`;
    }
  }
  return config;
});
```

### 4. Configuration WebSocket

```typescript
// config/socket.ts
import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL && import.meta.env.VITE_SOCKET_URL !== 'http://localhost:3001') {
    return import.meta.env.VITE_SOCKET_URL;
  }
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:3001`;
  }
  return 'http://localhost:3001';
};

export const socket = io(getSocketUrl(), {
  transports: ['websocket']
});
```

---

## 📖 Utilisation de l'API

### Créer une Session

```typescript
const createSession = async (username?: string) => {
  const response = await api.post('/sessions', { username });
  return response.data; // { session: {...}, playerId: "..." }
};

// Usage
const { session, playerId } = await createSession('Player1');
console.log('Session code:', session.code); // "ABC123"
console.log('Your playerId:', playerId); // Save this!
```

### Rejoindre une Session

```typescript
const joinSession = async (code: string, username?: string) => {
  const response = await api.post(`/sessions/${code}/join`, { username });
  return response.data; // { session: {...}, role: "player2", playerId: "..." }
};

// Usage
const { session, role, playerId } = await joinSession('ABC123', 'Player2');
console.log('Role:', role); // "player2" or "spectator"
console.log('Your playerId:', playerId); // Save this!
```

### WebSocket - Rejoindre une Session

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  // Use the playerId from REST API!
  socket.emit('join_session', {
    sessionCode: 'ABC123',
    playerId: playerId, // From REST API response
    username: 'Player1'
  });
});

socket.on('session_info', ({ session, role }) => {
  console.log('Role:', role); // "player1", "player2", or "spectator"
});

socket.on('game_state', (state) => {
  // Initial game state for your player
  console.log('Your game state:', state);
});

socket.on('state_update', ({ playerId, state }) => {
  if (playerId === myPlayerId) {
    // Update your game state
  } else {
    // Update opponent's game state
  }
});
```

### Envoyer un Mouvement

```typescript
socket.emit('player_move', {
  type: 'left', // 'left' | 'right' | 'rotate' | 'down' | 'drop'
  playerId: myPlayerId,
  sessionCode: 'ABC123'
});
```

### Envoyer un Message Chat

```typescript
socket.emit('chat_message', {
  sessionCode: 'ABC123',
  userId: myPlayerId,
  username: 'Player1',
  message: 'Hello!'
});
```

---

## ⚠️ Points Critiques

### 1. PlayerId Consistency

**CRITIQUE:** Toujours utiliser le `playerId` retourné par l'API REST pour la connexion WebSocket !

```typescript
// ✅ CORRECT
const { playerId } = await createSession('Player1');
socket.emit('join_session', { sessionCode, playerId, username });

// ❌ INCORRECT - Ne générez pas un nouveau playerId
const wrongPlayerId = `guest_${Date.now()}`;
socket.emit('join_session', { sessionCode, playerId: wrongPlayerId, username });
```

### 2. Gestion des Erreurs

Toujours vérifier les codes d'erreur :

```typescript
try {
  const response = await api.post('/sessions/ABC123/join', { username });
  // Success
} catch (error) {
  if (error.response) {
    const { code, details } = error.response.data;
    
    switch (code) {
      case 'SESSION_NOT_FOUND':
        // Session n'existe pas
        break;
      case 'INVALID_SESSION_CODE':
        // Code invalide
        break;
      default:
        // Autre erreur
    }
  }
}
```

### 3. États de Session

- `waiting` - En attente du deuxième joueur
- `playing` - Partie en cours
- `finished` - Partie terminée

### 4. Rôles

- `player1` - Créateur de la session (peut jouer)
- `player2` - Deuxième joueur (peut jouer)
- `spectator` - Spectateur (ne peut pas jouer, seulement regarder)

---

## 📚 Documentation Complète

- **API REST:** Voir `API_DOCUMENTATION.md`
- **Codes d'erreur:** Voir `ERROR_CODES.md`
- **Swagger UI:** `http://localhost:3001/api-docs` (quand le backend est lancé)

---

## 🧪 Exemple Complet

```typescript
// 1. Créer une session
const { session, playerId } = await api.post('/sessions', { 
  username: 'Player1' 
}).then(r => r.data);

// 2. Connecter WebSocket
const socket = io('http://localhost:3001');
socket.on('connect', () => {
  socket.emit('join_session', {
    sessionCode: session.code,
    playerId: playerId, // IMPORTANT: utiliser celui de l'API REST
    username: 'Player1'
  });
});

// 3. Écouter les événements
socket.on('session_info', ({ role }) => {
  console.log('Vous êtes:', role);
});

socket.on('game_state', (state) => {
  // État initial du jeu
});

socket.on('state_update', ({ playerId, state }) => {
  // Mise à jour de l'état
});

// 4. Envoyer des mouvements
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    socket.emit('player_move', {
      type: 'left',
      playerId: playerId,
      sessionCode: session.code
    });
  }
});
```

---

## ❓ Questions Fréquentes

**Q: Pourquoi je deviens spectator au lieu de player2 ?**  
R: Vérifiez que vous utilisez le même `playerId` pour REST et WebSocket. Voir section "PlayerId Consistency".

**Q: Comment savoir si je suis player1, player2 ou spectator ?**  
R: Écoutez l'événement `session_info` qui contient le `role`.

**Q: Le backend doit-il être modifié pour un autre frontend ?**  
R: Non, le backend est indépendant. Assurez-vous juste que les URLs CORS autorisent votre frontend.

**Q: Comment gérer les déconnexions ?**  
R: Écoutez l'événement `disconnect` et reconnectez si nécessaire. Le serveur nettoie automatiquement les sessions vides.

---

## 🔗 Ressources

- Documentation API complète: `API_DOCUMENTATION.md`
- Liste des codes d'erreur: `ERROR_CODES.md`
- Swagger UI: `http://localhost:3001/api-docs`

