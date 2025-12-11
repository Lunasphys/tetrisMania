# 📚 Documentation Complète du Projet Tetris Mania

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [WebSocket - Communication Temps Réel](#websocket---communication-temps-réel)
4. [Jest - Tests Unitaires](#jest---tests-unitaires)
5. [Swagger - Documentation API](#swagger---documentation-api)
6. [Supabase - Base de Données et Authentification](#supabase---base-de-données-et-authentification)
7. [API REST](#api-rest)
8. [Structure du Projet](#structure-du-projet)
9. [Configuration et Déploiement](#configuration-et-déploiement)

---

## 🎯 Vue d'ensemble

**Tetris Mania** est une application full-stack TypeScript permettant de jouer au Tetris en 1v1 en ligne avec :
- Communication temps réel via WebSocket
- Système d'authentification et de profils utilisateurs
- Classement global et personnel
- Système d'amis et invitations de jeu
- Chat en temps réel pendant les parties

### Technologies Principales

- **Backend** : Node.js + Express + TypeScript
- **Frontend** : React + TypeScript + Vite
- **WebSocket** : Socket.io
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth
- **Documentation API** : Swagger/OpenAPI
- **Tests** : Jest + ts-jest

---

## 🏗️ Architecture

### Architecture Générale

```markdown:DOCUMENTATION_PROJET.md
┌─────────────────┐         ┌─────────────────┐
│   Frontend       │         │    Backend      │
│   (React)        │◄───────►│   (Express)     │
│                  │  REST   │                 │
│  - Pages         │         │  - Routes       │
│  - Components    │         │  - Controllers  │
│  - Services      │         │  - Services     │
│  - Hooks         │         │  - Models       │
└────────┬─────────┘         └────────┬────────┘
         │                            │
         │                            │
         │         WebSocket          │
         │      (Socket.io)           │
         │◄───────────────────────────┤
         │                            │
         │                            │
┌────────▼───────────────────────────▼────────┐
│           Supabase (PostgreSQL)              │
│  - Authentication                            │
│  - Database (profiles, scores, friends)      │
└──────────────────────────────────────────────┘
```

### Flux de Données

1. **Authentification** : Frontend → REST API → Supabase Auth
2. **Création de Session** : Frontend → REST API → Backend (mémoire)
3. **Jeu en Temps Réel** : Frontend ↔ WebSocket ↔ Backend
4. **Sauvegarde des Scores** : Backend → Supabase Database
5. **Gestion des Amis** : Frontend → REST API → Supabase Database

---

## 🔌 WebSocket - Communication Temps Réel

### Vue d'ensemble

Le système WebSocket utilise **Socket.io** pour gérer la communication bidirectionnelle en temps réel entre le client et le serveur. Il est essentiel pour la synchronisation de l'état de jeu entre les deux joueurs.

### Architecture WebSocket

#### Configuration Serveur

Le serveur WebSocket est initialisé dans `backend/src/websocket/gameSocket.ts` :

```typescript
// Configuration CORS pour développement et production
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL || 'http://localhost:5173']
  : [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      /^http:\/\/192\.168\.\d+\.\d+:5173$/, // Réseau local
      /^http:\/\/10\.\d+\.\d+\.\d+:5173$/,  // Réseau local (10.x.x.x)
      /^http:\/\/172\.\d+\.\d+\.\d+:5173$/, // Hotspot (172.x.x.x)
    ];

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
```

#### Gestion de l'État des Joueurs

L'état de chaque joueur est stocké en mémoire dans une `Map` :

```typescript
const playerStates = new Map<string, PlayerState>();
```

Chaque `PlayerState` contient :
- `grid` : Grille de jeu 20x10
- `currentPiece` : Pièce actuelle
- `nextPiece` : Prochaine pièce
- `score` : Score actuel
- `linesCleared` : Lignes effacées
- `level` : Niveau actuel
- `gameOver` : État de fin de partie

### Événements WebSocket

#### Événements Client → Serveur

##### 1. `join_session`
Rejoint une session de jeu via WebSocket.

**Payload :**
```typescript
{
  sessionCode: string;    // Code de session (6 caractères)
  playerId: string;       // ID du joueur (retourné par REST API)
  username: string;       // Nom d'utilisateur
}
```

**Logique serveur :**
- Vérifie l'existence de la session
- Détermine le rôle (player1 ou player2)
- Limite à 2 joueurs maximum
- Initialise l'état du joueur si nécessaire
- Envoie l'état initial du jeu si la partie est en cours

##### 2. `start_game`
Démarre la partie (uniquement player1).

**Payload :**
```typescript
{
  sessionCode: string;
  playerId: string;
}
```

**Validations :**
- Seul player1 peut démarrer
- Les deux joueurs doivent être connectés
- La session doit être en statut "waiting"

**Actions :**
- Met à jour le statut de session à "playing"
- Envoie l'état initial du jeu aux deux joueurs
- Émet `game_started` à tous les joueurs

##### 3. `player_move`
Envoie un mouvement de jeu.

**Payload :**
```typescript
{
  type: 'left' | 'right' | 'rotate' | 'down' | 'drop';
  playerId: string;
  sessionCode: string;
}
```

**Types de mouvements :**
- `left` : Déplacer à gauche
- `right` : Déplacer à droite
- `rotate` : Rotation horaire
- `down` : Descente douce (1 case)
- `drop` : Descente rapide (jusqu'en bas)

**Logique serveur :**
- Valide le mouvement
- Vérifie les collisions
- Met à jour l'état du joueur
- Gère la logique de jeu (placement, effacement de lignes, score)
- Détecte la fin de partie
- Émet `state_update` à tous les joueurs de la session

##### 4. `chat_message`
Envoie un message de chat.

**Payload :**
```typescript
{
  sessionCode: string;
  userId: string;
  username: string;
  message: string;  // Max 500 caractères
}
```

**Validations :**
- Message non vide
- Longueur maximale : 500 caractères

##### 5. `leave_session`
Quitte une session.

**Payload :**
```typescript
{
  sessionCode: string;
  playerId: string;
}
```

**Actions :**
- Retire le joueur de la session
- Supprime l'état du joueur
- Notifie les autres joueurs

#### Événements Serveur → Client

##### 1. `connect` / `disconnect`
Événements natifs Socket.io pour la connexion/déconnexion.

##### 2. `session_info`
Informations sur la session.

**Payload :**
```typescript
{
  session: GameSession;
  role: 'player1' | 'player2';
  waiting: boolean;
  bothPlayersConnected: boolean;
  canStart: boolean;  // true si player1 et les deux joueurs sont connectés
}
```

##### 3. `both_players_ready`
Émis quand les deux joueurs sont connectés mais la partie n'a pas encore démarré.

**Payload :**
```typescript
{
  message: string;
  session: GameSession;
  canStart: boolean;
}
```

##### 4. `game_started`
Émis quand player1 démarre la partie.

**Payload :**
```typescript
{
  message: string;
  session: GameSession;
}
```

##### 5. `game_state`
État initial du jeu (émis au démarrage).

**Payload :**
```typescript
{
  userId: string;
  username: string;
  grid: number[][];  // 20x10, 0 = vide, 1 = bloc
  currentPiece: Tetromino;
  nextPiece: Tetromino;
  score: number;
  linesCleared: number;
  level: number;
  gameOver: boolean;
}
```

##### 6. `state_update`
Mise à jour de l'état d'un joueur.

**Payload :**
```typescript
{
  playerId: string;
  state: PlayerState;
}
```

**Note importante :** Le client doit vérifier si `playerId` correspond à son propre ID pour déterminer s'il s'agit de son état ou de celui de l'adversaire.

##### 7. `game_finished`
Émis quand la partie se termine.

**Payload :**
```typescript
{
  reason: 'timeout' | 'game_over';
  winner: 'player1' | 'player2' | 'tie';
  winnerScore: number;
  loserScore: number;
  player1Score: number;
  player2Score: number;
  player1Username: string;
  player2Username: string;
  player1LinesCleared: number;
  player2LinesCleared: number;
  session: GameSession;
}
```

**Raisons de fin :**
- `timeout` : Durée de 2 minutes écoulée
- `game_over` : Un joueur a perdu (grille remplie)

**Détermination du gagnant :**
- Le joueur avec le score le plus élevé gagne
- En cas d'égalité : `tie`

##### 8. `chat_message`
Message de chat reçu.

**Payload :**
```typescript
{
  id: string;
  sessionCode: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;  // ISO 8601
}
```

##### 9. `player_joined` / `player_left`
Notifications de connexion/déconnexion de joueurs.

##### 10. `error`
Erreur survenue.

**Payload :**
```typescript
{
  message: string;
  details?: string;
  code?: string;
  // ... autres champs selon l'erreur
}
```

### Gestion du Temps de Jeu

Un timer vérifie toutes les secondes les parties en cours :

```typescript
const GAME_DURATION_MS = 2 * 60 * 1000; // 2 minutes

setInterval(() => {
  const playingSessions = getAllSessions()
    .filter(s => s.status === 'playing');
  
  for (const session of playingSessions) {
    const startTime = getGameStartTime(session.code);
    if (startTime && Date.now() - startTime >= GAME_DURATION_MS) {
      endGame(io, session.code, 'timeout');
    }
  }
}, 1000);
```

### Sauvegarde Automatique des Scores

Quand une partie se termine, les scores sont automatiquement sauvegardés dans Supabase :

```typescript
async function endGame(io: SocketIOServer, sessionCode: string, reason: 'timeout' | 'game_over') {
  // ... détermination du gagnant ...
  
  // Sauvegarde des scores
  if (player1State && session.player1_id) {
    await supabase.from('scores').insert({
      user_id: session.player1_id.startsWith('guest_') ? null : session.player1_id,
      username: player1State.username,
      score: player1State.score,
      lines_cleared: player1State.linesCleared,
      session_code: sessionCode,
    });
  }
  
  // Même chose pour player2...
}
```

### Hook Frontend : `useWebSocket`

Le hook React `useWebSocket` simplifie l'utilisation de WebSocket côté client :

```typescript
const {
  connected,
  gameState,
  opponentState,
  chatMessages,
  sessionInfo,
  gameResult,
  sendMove,
  sendChatMessage,
  leaveSession,
  startGame,
} = useWebSocket(sessionCode, playerId, username);
```

**Fonctionnalités :**
- Connexion automatique quand `sessionCode`, `playerId` et `username` sont disponibles
- Gestion automatique des événements
- État réactif pour l'UI
- Méthodes utilitaires pour envoyer des mouvements et messages

### Bonnes Pratiques WebSocket

1. **Cohérence du playerId** : Toujours utiliser le `playerId` retourné par l'API REST pour WebSocket
2. **Gestion des erreurs** : Écouter l'événement `error` et afficher des messages appropriés
3. **Nettoyage** : Déconnecter le socket lors du démontage du composant
4. **Reconnexion** : Socket.io gère automatiquement la reconnexion
5. **Validation** : Le serveur valide tous les mouvements avant de les appliquer

---

## 🧪 Jest - Tests Unitaires

### Configuration

Le projet utilise **Jest** avec **ts-jest** pour exécuter des tests TypeScript.

**Configuration (`backend/jest.config.js`) :**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
};
```

### Structure des Tests

Les tests sont organisés dans `backend/src/__tests__/` :

- `tetris.test.ts` : Tests de la logique Tetris
- `sessionService.test.ts` : Tests du service de sessions
- `friends.test.ts` : Tests du système d'amis
- `gameInvitations.test.ts` : Tests des invitations de jeu

### Exemples de Tests

#### Tests Tetris (`tetris.test.ts`)

```typescript
describe('Tetris Logic', () => {
  describe('createTetromino', () => {
    it('should create a tetromino with valid shape and position', () => {
      const tetromino = createTetromino('I');
      expect(tetromino.type).toBe('I');
      expect(tetromino.shape).toBeDefined();
      expect(tetromino.position).toBeDefined();
    });
  });

  describe('rotateTetromino', () => {
    it('should rotate a tetromino to the next rotation state', () => {
      const tetromino = createTetromino('I');
      const rotated = rotateTetromino(tetromino);
      expect(rotated.rotation).toBe((initialRotation + 1) % 2);
    });
  });

  describe('isValidPosition', () => {
    it('should return false for position outside grid bounds', () => {
      const grid = createEmptyGrid();
      const tetromino = {
        ...createTetromino('O'),
        position: { x: -1, y: 0 },
      };
      expect(isValidPosition(grid, tetromino)).toBe(false);
    });
  });

  describe('clearLines', () => {
    it('should clear a full line', () => {
      const grid = createEmptyGrid();
      // Remplir une ligne
      for (let col = 0; col < GRID_WIDTH; col++) {
        grid[GRID_HEIGHT - 1][col] = 1;
      }
      const { linesCleared } = clearLines(grid);
      expect(linesCleared).toBe(1);
    });
  });

  describe('calculateScore', () => {
    it('should return 100 for 1 line at level 0', () => {
      expect(calculateScore(1, 0)).toBe(100);
    });
    
    it('should multiply score by level + 1', () => {
      expect(calculateScore(1, 1)).toBe(200); // 100 * 2
    });
  });
});
```

#### Tests Session Service (`sessionService.test.ts`)

```typescript
describe('Session Service', () => {
  beforeEach(() => {
    // Nettoyer les sessions avant chaque test
    const sessions = getAllSessions();
    sessions.forEach((session) => {
      leaveSession(session.code, session.player1_id || '');
      if (session.player2_id) {
        leaveSession(session.code, session.player2_id);
      }
    });
  });

  describe('createSession', () => {
    it('should create a new session with player1', () => {
      const session = createSession('player1', 'Player1');
      expect(session.player1_id).toBe('player1');
      expect(session.status).toBe('waiting');
      expect(session.code).toHaveLength(6);
    });
  });

  describe('joinSession', () => {
    it('should allow second player to join as player2', () => {
      const session = createSession('player1', 'Player1');
      const { role } = joinSession(session.code, 'player2', 'Player2');
      expect(role).toBe('player2');
    });

    it('should throw error when session is full', () => {
      const session = createSession('player1', 'Player1');
      joinSession(session.code, 'player2', 'Player2');
      
      expect(() => {
        joinSession(session.code, 'player3', 'Player3');
      }).toThrow('Session is full');
    });
  });
});
```

### Exécution des Tests

```bash
# Exécuter tous les tests
cd backend
npm test

# Mode watch (réexécution automatique)
npm run test:watch

# Avec couverture de code
npm test -- --coverage
```

### Couverture de Code

Les tests couvrent :
- ✅ Logique Tetris (rotation, collision, effacement de lignes, score)
- ✅ Gestion des sessions (création, join, leave)
- ✅ Règles métier (limite de 2 joueurs, validation)
- ✅ Services (friends, game invitations)

---

## 📖 Swagger - Documentation API

### Configuration

Swagger est configuré dans `backend/src/config/swagger.ts` :

```typescript
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tetris Mania API',
      version: '1.0.0',
      description: 'API for Tetris 1v1 online game',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: { /* ... */ },
        Session: { /* ... */ },
        Score: { /* ... */ },
        // ...
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
```

### Intégration dans Express

```typescript
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

### Accès à la Documentation

Une fois le serveur démarré, la documentation Swagger est accessible à :
```
http://localhost:3001/api-docs
```

### Documentation des Endpoints

Les endpoints sont documentés directement dans le code source avec des annotations JSDoc :

```typescript
/**
 * @swagger
 * /api/v1/sessions:
 *   post:
 *     summary: Create a new game session
 *     tags: [Sessions]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *     responses:
 *       201:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 */
```

### Schémas Définis

- **User** : Informations utilisateur
- **Session** : Session de jeu
- **Score** : Score de partie
- **FriendRequest** : Demande d'ami
- **Error** : Format d'erreur

### Avantages de Swagger

1. **Documentation interactive** : Tester les endpoints directement depuis l'interface
2. **Validation** : Vérification automatique des schémas
3. **Génération de code** : Possibilité de générer des clients API
4. **Maintenance** : Documentation toujours à jour avec le code

---

## 🗄️ Supabase - Base de Données et Authentification

### Vue d'ensemble

Supabase fournit :
- **Authentification** : Gestion des utilisateurs (signup, login, logout)
- **Base de données PostgreSQL** : Stockage des données
- **Row Level Security (RLS)** : Sécurité au niveau des lignes

### Configuration

**Backend (`backend/src/config/supabase.ts`) :**
```typescript
import { createClient } from '@supabase/supabase-js';

// Client pour opérations utilisateur (utilise anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client admin pour opérations serveur (utilise service role key)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
```

**Frontend (`frontend/src/config/supabase.ts`) :**
```typescript
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Variables d'Environnement

**Backend (.env) :**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Frontend (.env) :**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Schéma de Base de Données

#### Table `profiles`

Étend les utilisateurs Supabase Auth avec des informations supplémentaires.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Politiques RLS :**
- Les utilisateurs peuvent voir tous les profils
- Les utilisateurs peuvent mettre à jour leur propre profil

#### Table `scores`

Stocke les scores des parties.

```sql
CREATE TABLE public.scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  score INTEGER NOT NULL,
  lines_cleared INTEGER DEFAULT 0,
  session_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Politiques RLS :**
- Tout le monde peut voir les scores (leaderboard public)
- Tout le monde peut insérer des scores
- Les utilisateurs peuvent voir leurs propres scores

#### Table `friend_requests`

Gère les demandes d'amis.

```sql
CREATE TABLE public.friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);
```

**Politiques RLS :**
- Les utilisateurs peuvent voir leurs propres demandes
- Les utilisateurs peuvent créer des demandes
- Les utilisateurs peuvent mettre à jour les demandes reçues

#### Table `game_invitations`

Gère les invitations de jeu.

```sql
CREATE TABLE public.game_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

**Important :** Le backend utilise `SUPABASE_SERVICE_ROLE_KEY` pour contourner les politiques RLS. L'authentification est validée dans le middleware avant les opérations de base de données, garantissant la sécurité tout en permettant au backend d'effectuer les requêtes nécessaires.

### Fonctions et Triggers

#### Trigger `on_auth_user_created`

Crée automatiquement un profil quand un utilisateur s'inscrit :

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO UPDATE SET username = COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Trigger `update_updated_at_column`

Met à jour automatiquement le champ `updated_at` :

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Indexes pour Performance

```sql
CREATE INDEX idx_scores_user_id ON public.scores(user_id);
CREATE INDEX idx_scores_score ON public.scores(score DESC);
CREATE INDEX idx_scores_created_at ON public.scores(created_at DESC);
CREATE INDEX idx_friend_requests_from_user ON public.friend_requests(from_user_id);
CREATE INDEX idx_friend_requests_to_user ON public.friend_requests(to_user_id);
CREATE INDEX idx_friend_requests_status ON public.friend_requests(status);
```

### Utilisation dans le Code

#### Authentification

```typescript
// Signup
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { username }
  }
});

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

// Logout
await supabase.auth.signOut();
```

#### Requêtes Base de Données

```typescript
// Insérer un score
await supabase.from('scores').insert({
  user_id: userId,
  username: username,
  score: score,
  lines_cleared: linesCleared,
  session_code: sessionCode,
});

// Récupérer le leaderboard
const { data } = await supabase
  .from('scores')
  .select('*')
  .order('score', { ascending: false })
  .limit(100);
```

---

## 🌐 API REST

### Base URL

```
http://localhost:3001/api/v1
```

### Authentification

La plupart des endpoints supportent à la fois les utilisateurs authentifiés et les invités. Pour les endpoints authentifiés, inclure le token JWT Supabase :

```
Authorization: Bearer <supabase_jwt_token>
```

### Endpoints Principaux

#### Authentification

- `POST /api/v1/auth/signup` - Créer un compte
- `POST /api/v1/auth/login` - Se connecter
- `POST /api/v1/auth/logout` - Se déconnecter
- `POST /api/v1/auth/forgot-password` - Demander une réinitialisation de mot de passe
- `DELETE /api/v1/auth/delete-account` - Supprimer un compte

#### Sessions

- `POST /api/v1/sessions` - Créer une session de jeu
- `GET /api/v1/sessions/:code` - Obtenir les informations d'une session
- `GET /api/v1/sessions` - Lister les sessions actives
- `POST /api/v1/sessions/:code/join` - Rejoindre une session

#### Leaderboard

- `GET /api/v1/leaderboard` - Obtenir le classement global
- `GET /api/v1/leaderboard/users/:id/scores` - Obtenir les scores d'un utilisateur
- `POST /api/v1/leaderboard` - Sauvegarder un score

#### Amis

- `POST /api/v1/friends/request` - Envoyer une demande d'ami (par user ID)
- `POST /api/v1/friends/request-by-username` - Envoyer une demande d'ami (par username)
- `POST /api/v1/friends/accept` - Accepter une demande
- `POST /api/v1/friends/refuse` - Refuser une demande
- `GET /api/v1/friends` - Obtenir la liste d'amis
- `GET /api/v1/friends/pending` - Obtenir les demandes en attente
- `GET /api/v1/friends/search?username=...` - Rechercher des utilisateurs
- `DELETE /api/v1/friends/remove` - Supprimer un ami

#### Invitations de Jeu

- `POST /api/v1/game-invitations/send` - Envoyer une invitation
- `GET /api/v1/game-invitations/pending` - Obtenir les invitations en attente
- `POST /api/v1/game-invitations/accept` - Accepter une invitation
- `POST /api/v1/game-invitations/reject` - Rejeter une invitation

### Exemple de Requête

**Créer une session :**
```typescript
const response = await fetch('http://localhost:3001/api/v1/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'Player1' })
});

const { session, playerId } = await response.json();
// Important : Sauvegarder playerId pour WebSocket !
```

### Codes de Réponse

- `200` : Succès
- `201` : Créé
- `400` : Requête invalide
- `401` : Non authentifié
- `403` : Accès refusé
- `404` : Non trouvé
- `500` : Erreur serveur

### Middleware d'Authentification

Le backend utilise deux middlewares :

- `requireAuth` : Authentification obligatoire
- `optionalAuth` : Authentification optionnelle (pour invités)

```typescript
// Exemple d'utilisation
router.post('/friends/request', requireAuth, sendFriendRequest);
router.post('/sessions', optionalAuth, createGameSession);
```

---

## 📁 Structure du Projet

```
tetrisMania/
├── backend/
│   ├── src/
│   │   ├── config/              # Configuration
│   │   │   ├── supabase.ts      # Client Supabase
│   │   │   └── swagger.ts       # Configuration Swagger
│   │   ├── controllers/          # Contrôleurs de routes
│   │   │   ├── authController.ts
│   │   │   ├── friendsController.ts
│   │   │   ├── gameInvitationsController.ts
│   │   │   ├── leaderboardController.ts
│   │   │   └── sessionController.ts
│   │   ├── middleware/          # Middleware Express
│   │   │   └── auth.ts          # Authentification
│   │   ├── models/              # Modèles de données
│   │   │   ├── tetris.ts        # Logique Tetris
│   │   │   └── types.ts         # Types TypeScript
│   │   ├── routes/              # Routes Express
│   │   │   ├── authRoutes.ts
│   │   │   ├── friendsRoutes.ts
│   │   │   ├── gameInvitationsRoutes.ts
│   │   │   ├── leaderboardRoutes.ts
│   │   │   └── sessionRoutes.ts
│   │   ├── services/            # Logique métier
│   │   │   └── sessionService.ts
│   │   ├── utils/               # Utilitaires
│   │   │   └── helpers.ts
│   │   ├── websocket/           # WebSocket
│   │   │   └── gameSocket.ts    # Gestion WebSocket
│   │   ├── __tests__/           # Tests Jest
│   │   │   ├── tetris.test.ts
│   │   │   ├── sessionService.test.ts
│   │   │   ├── friends.test.ts
│   │   │   └── gameInvitations.test.ts
│   │   └── index.ts             # Point d'entrée
│   ├── jest.config.js           # Configuration Jest
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Composants React
│   │   │   ├── Chat.tsx
│   │   │   ├── InviteFriendsList.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── TetrisGrid.tsx
│   │   ├── contexts/            # Contextes React
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/               # Hooks personnalisés
│   │   │   └── useWebSocket.ts  # Hook WebSocket
│   │   ├── pages/               # Pages
│   │   │   ├── AuthPage.tsx
│   │   │   ├── GamePage.tsx
│   │   │   ├── HomePage.tsx
│   │   │   ├── LeaderboardPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   └── SignupPage.tsx
│   │   ├── services/            # Services API
│   │   │   ├── friendsService.ts
│   │   │   ├── gameInvitationsService.ts
│   │   │   ├── gameService.ts
│   │   │   └── leaderboardService.ts
│   │   ├── config/              # Configuration
│   │   │   ├── api.ts
│   │   │   └── supabase.ts
│   │   ├── styles/              # Styles CSS
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── supabase/
│   └── schema.sql               # Schéma de base de données
│
├── README.md
├── API_DOCUMENTATION.md
└── package.json
```

---

## ⚙️ Configuration et Déploiement

### Installation

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Configuration Backend

Créer `backend/.env` :

```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
```

### Configuration Frontend

Créer `frontend/.env` :

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

### Démarrage

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

### Accès

- Frontend : http://localhost:5173
- Backend API : http://localhost:3001
- Documentation Swagger : http://localhost:3001/api-docs
- Health Check : http://localhost:3001/health

### Déploiement Production

1. **Variables d'environnement** : Configurer les variables pour la production
2. **Redis** : Remplacer le stockage en mémoire des sessions par Redis
3. **HTTPS** : Utiliser HTTPS pour WebSocket
4. **CORS** : Configurer les origines CORS appropriées
5. **RLS** : Activer Row Level Security dans Supabase
6. **Monitoring** : Configurer la journalisation et le monitoring

---

## 📝 Notes Importantes

### Sessions en Mémoire

Les sessions sont actuellement stockées en mémoire. En production, utiliser Redis pour la persistance et la scalabilité.

### Mode Invité

Les utilisateurs invités peuvent jouer mais ne peuvent pas :
- Utiliser le système d'amis
- Voir le leaderboard personnel
- Envoyer/recevoir des invitations de jeu

### Durée de Partie

Chaque partie a une durée maximale de 2 minutes. Après ce délai, la partie se termine automatiquement et le gagnant est déterminé par le score le plus élevé.

### Recherche d'Utilisateurs

La recherche d'amis utilise `profiles.username` (défini lors de l'inscription), pas le nom d'affichage en jeu.

---

## 🔗 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Socket.io](https://socket.io/docs/)
- [Documentation Swagger](https://swagger.io/docs/)
- [Documentation Jest](https://jestjs.io/docs/getting-started)

---

**Document généré le :** $(date)
**Version du projet :** 1.0.0
```

Documentation créée. Elle couvre :

1. Vue d'ensemble du projet
2. WebSocket : architecture, événements, gestion d'état, bonnes pratiques
3. Jest : configuration, exemples de tests, exécution
4. Swagger : configuration, documentation interactive, schémas
5. Supabase : schéma, RLS, utilisation
6. API REST : endpoints, authentification, exemples

Le document est en français et prêt à être utilisé. Souhaitez-vous que je l'enregistre dans un fichier spécifique ou que j'ajoute des sections ?
