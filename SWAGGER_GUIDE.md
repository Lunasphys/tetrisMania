# 📚 Guide Swagger - Tetris Mania API

Guide complet pour mettre en place la documentation Swagger/OpenAPI 3.0 sur le projet Tetris Mania.

---

## 📋 Table des matières

1. [Prérequis](#1-prérequis)
2. [Installation des dépendances](#2-installation-des-dépendances)
3. [Configuration Swagger](#3-configuration-swagger)
4. [Intégration dans Express](#4-intégration-dans-express)
5. [Documentation des routes](#5-documentation-des-routes)
6. [Schémas de données](#6-schémas-de-données)
7. [Authentification Bearer](#7-authentification-bearer)
8. [Accès et utilisation](#8-accès-et-utilisation)
9. [Bonnes pratiques](#9-bonnes-pratiques)
10. [Dépannage](#10-dépannage)

---

## 1. Prérequis

- Node.js >= 18.x
- npm ou yarn
- Projet Express.js avec TypeScript
- Structure de projet :

```
backend/
├── src/
│   ├── config/
│   │   └── swagger.ts          # Configuration Swagger
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── sessionRoutes.ts
│   │   ├── leaderboardRoutes.ts
│   │   ├── friendsRoutes.ts
│   │   └── gameInvitationsRoutes.ts
│   ├── controllers/
│   └── index.ts                # Point d'entrée Express
├── package.json
└── tsconfig.json
```

---

## 2. Installation des dépendances

```bash
cd backend

# Packages principaux
npm install swagger-jsdoc swagger-ui-express

# Types TypeScript
npm install -D @types/swagger-jsdoc @types/swagger-ui-express
```

Vérifier l'installation :

```bash
npm list swagger-jsdoc swagger-ui-express
```

---

## 3. Configuration Swagger

Créer le fichier `backend/src/config/swagger.ts` :

```typescript
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tetris Mania API',
      version: '1.0.0',
      description: `
API REST pour le jeu Tetris Mania - Jeu multijoueur 1v1 en temps réel.

## Fonctionnalités

- **Authentification** : Inscription, connexion, gestion de compte
- **Sessions de jeu** : Création et gestion des parties
- **Leaderboard** : Classements et scores
- **Système d'amis** : Ajout, recherche, gestion des amis
- **Invitations** : Inviter des amis à rejoindre une partie

## Authentification

La plupart des endpoints nécessitent un token JWT Bearer.
Obtenez un token via \`POST /api/v1/auth/login\` puis utilisez-le dans le header :
\`\`\`
Authorization: Bearer <votre_token>
\`\`\`
      `,
      contact: {
        name: 'Support Tetris Mania',
        email: 'support@tetrismania.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Serveur de développement',
      },
      {
        url: 'https://api.tetrismania.com',
        description: 'Serveur de production',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu via /api/v1/auth/login',
        },
      },
      schemas: {
        // === UTILISATEUR ===
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Identifiant unique',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email',
              example: 'player@example.com',
            },
            username: {
              type: 'string',
              description: "Nom d'affichage",
              example: 'TetrisMaster42',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création du compte',
              example: '2024-01-15T10:30:00Z',
            },
          },
        },

        // === SESSION DE JEU ===
        Session: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code unique de la session (6 caractères)',
              example: 'ABC123',
            },
            player1_id: {
              type: 'string',
              nullable: true,
              description: 'ID du joueur 1 (créateur)',
            },
            player2_id: {
              type: 'string',
              nullable: true,
              description: 'ID du joueur 2',
            },
            player1_username: {
              type: 'string',
              nullable: true,
              description: 'Pseudo du joueur 1',
              example: 'TetrisMaster42',
            },
            player2_username: {
              type: 'string',
              nullable: true,
              description: 'Pseudo du joueur 2',
              example: 'BlockChampion',
            },
            status: {
              type: 'string',
              enum: ['waiting', 'playing', 'finished'],
              description: 'État de la session',
              example: 'waiting',
            },
            spectators: {
              type: 'array',
              items: { type: 'string' },
              description: 'Liste des IDs des spectateurs',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },

        // === LEADERBOARD ===
        LeaderboardEntry: {
          type: 'object',
          properties: {
            rank: {
              type: 'integer',
              description: 'Position dans le classement',
              example: 1,
            },
            user_id: {
              type: 'string',
              format: 'uuid',
            },
            username: {
              type: 'string',
              example: 'TetrisMaster42',
            },
            score: {
              type: 'integer',
              description: 'Meilleur score',
              example: 125000,
            },
            games_played: {
              type: 'integer',
              description: 'Nombre de parties jouées',
              example: 42,
            },
            wins: {
              type: 'integer',
              description: 'Nombre de victoires',
              example: 28,
            },
          },
        },

        // === AMIS ===
        Friend: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: "ID de l'ami",
            },
            username: {
              type: 'string',
              example: 'BlockChampion',
            },
            status: {
              type: 'string',
              enum: ['online', 'offline', 'in_game'],
              description: "Statut de l'ami",
              example: 'online',
            },
            added_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },

        FriendRequest: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID de la demande',
            },
            from_user_id: {
              type: 'string',
              format: 'uuid',
            },
            from_username: {
              type: 'string',
              example: 'NewPlayer99',
            },
            to_user_id: {
              type: 'string',
              format: 'uuid',
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'refused'],
              example: 'pending',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },

        // === INVITATION DE JEU ===
        GameInvitation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            from_user_id: {
              type: 'string',
              format: 'uuid',
            },
            from_username: {
              type: 'string',
              example: 'TetrisMaster42',
            },
            to_user_id: {
              type: 'string',
              format: 'uuid',
            },
            session_code: {
              type: 'string',
              description: 'Code de la session à rejoindre',
              example: 'XYZ789',
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'rejected', 'expired'],
              example: 'pending',
            },
            expires_at: {
              type: 'string',
              format: 'date-time',
              description: "Date d'expiration de l'invitation",
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },

        // === RÉPONSES STANDARD ===
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'string',
              description: "Message d'erreur",
              example: 'Authentication required',
            },
            details: {
              type: 'string',
              description: "Détails de l'erreur",
            },
            code: {
              type: 'string',
              description: "Code d'erreur pour le client",
              example: 'AUTHENTICATION_REQUIRED',
            },
          },
        },

        SuccessResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Operation completed successfully',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentification et gestion de compte',
      },
      {
        name: 'Sessions',
        description: 'Création et gestion des sessions de jeu',
      },
      {
        name: 'Leaderboard',
        description: 'Classements et scores',
      },
      {
        name: 'Friends',
        description: "Système d'amis",
      },
      {
        name: 'Game Invitations',
        description: 'Invitations à rejoindre une partie',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
```

---

## 4. Intégration dans Express

Modifier `backend/src/index.ts` :

```typescript
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// Import des routes
import authRoutes from './routes/authRoutes';
import sessionRoutes from './routes/sessionRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';
import friendsRoutes from './routes/friendsRoutes';
import gameInvitationsRoutes from './routes/gameInvitationsRoutes';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Tetris Mania API Docs',
}));

// Endpoint pour récupérer le JSON OpenAPI
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Routes API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/friends', friendsRoutes);
app.use('/api/v1/game-invitations', gameInvitationsRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
});
```

---

## 5. Documentation des routes

### Syntaxe JSDoc pour Swagger

Chaque route doit être documentée avec des commentaires JSDoc au format OpenAPI.

### Exemple complet : Auth Routes

```typescript
// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { signup, login, logout, forgotPassword, deleteAccount } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: Créer un nouveau compte
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: player@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: MySecurePassword123!
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 example: TetrisMaster42
 *     responses:
 *       201:
 *         description: Compte créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account created successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT token
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email ou username déjà utilisé
 */
router.post('/signup', signup);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: player@example.com
 *               password:
 *                 type: string
 *                 example: MySecurePassword123!
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       401:
 *         description: Identifiants invalides
 */
router.post('/login', login);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Déconnexion
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *       401:
 *         description: Non authentifié
 */
router.post('/logout', authMiddleware, logout);

/**
 * @swagger
 * /api/v1/auth/delete-account:
 *   delete:
 *     summary: Supprimer son compte
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compte supprimé
 *       401:
 *         description: Non authentifié
 */
router.delete('/delete-account', authMiddleware, deleteAccount);

export default router;
```

### Exemple : Session Routes

```typescript
// backend/src/routes/sessionRoutes.ts
import { Router } from 'express';
import { createSession, getSession, listSessions, joinSession } from '../controllers/sessionController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/v1/sessions:
 *   post:
 *     summary: Créer une nouvelle session de jeu
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Pseudo pour les joueurs non connectés
 *                 example: GuestPlayer
 *     responses:
 *       201:
 *         description: Session créée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Session created successfully
 *                 session:
 *                   $ref: '#/components/schemas/Session'
 *       500:
 *         description: Erreur serveur
 */
router.post('/', optionalAuth, createSession);

/**
 * @swagger
 * /api/v1/sessions/{code}:
 *   get:
 *     summary: Récupérer une session par son code
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Code de la session (6 caractères)
 *         example: ABC123
 *     responses:
 *       200:
 *         description: Détails de la session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       404:
 *         description: Session non trouvée
 */
router.get('/:code', getSession);

/**
 * @swagger
 * /api/v1/sessions:
 *   get:
 *     summary: Lister les sessions disponibles
 *     tags: [Sessions]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [waiting, playing, finished]
 *         description: Filtrer par statut
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre de résultats
 *     responses:
 *       200:
 *         description: Liste des sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Session'
 *                 total:
 *                   type: integer
 */
router.get('/', listSessions);

/**
 * @swagger
 * /api/v1/sessions/{code}/join:
 *   post:
 *     summary: Rejoindre une session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         example: ABC123
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Pseudo (si non connecté)
 *               as_spectator:
 *                 type: boolean
 *                 default: false
 *                 description: Rejoindre en tant que spectateur
 *     responses:
 *       200:
 *         description: Session rejointe
 *       400:
 *         description: Session pleine ou en cours
 *       404:
 *         description: Session non trouvée
 */
router.post('/:code/join', optionalAuth, joinSession);

export default router;
```

### Exemple : Friends Routes

```typescript
// backend/src/routes/friendsRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  sendFriendRequest,
  acceptFriendRequest,
  refuseFriendRequest,
  getFriends,
  getPendingRequests,
  searchUsers,
  removeFriend
} from '../controllers/friendsController';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/friends:
 *   get:
 *     summary: Récupérer la liste d'amis
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des amis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 friends:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Friend'
 *       401:
 *         description: Non authentifié
 */
router.get('/', getFriends);

/**
 * @swagger
 * /api/v1/friends/pending:
 *   get:
 *     summary: Récupérer les demandes d'ami en attente
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Demandes en attente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FriendRequest'
 *                 sent:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FriendRequest'
 */
router.get('/pending', getPendingRequests);

/**
 * @swagger
 * /api/v1/friends/search:
 *   get:
 *     summary: Rechercher des utilisateurs
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Terme de recherche (username)
 *         example: Tetris
 *     responses:
 *       200:
 *         description: Résultats de recherche
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       is_friend:
 *                         type: boolean
 *                       has_pending_request:
 *                         type: boolean
 */
router.get('/search', searchUsers);

/**
 * @swagger
 * /api/v1/friends/request:
 *   post:
 *     summary: Envoyer une demande d'ami par ID
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to_user_id
 *             properties:
 *               to_user_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Demande envoyée
 *       400:
 *         description: Demande déjà envoyée ou déjà amis
 *       404:
 *         description: Utilisateur non trouvé
 */
router.post('/request', sendFriendRequest);

/**
 * @swagger
 * /api/v1/friends/accept:
 *   post:
 *     summary: Accepter une demande d'ami
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - request_id
 *             properties:
 *               request_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Demande acceptée
 *       404:
 *         description: Demande non trouvée
 */
router.post('/accept', acceptFriendRequest);

/**
 * @swagger
 * /api/v1/friends/refuse:
 *   post:
 *     summary: Refuser une demande d'ami
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - request_id
 *             properties:
 *               request_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Demande refusée
 *       404:
 *         description: Demande non trouvée
 */
router.post('/refuse', refuseFriendRequest);

/**
 * @swagger
 * /api/v1/friends/remove:
 *   delete:
 *     summary: Supprimer un ami
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - friend_id
 *             properties:
 *               friend_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Ami supprimé
 *       404:
 *         description: Ami non trouvé
 */
router.delete('/remove', removeFriend);

export default router;
```

### Exemple : Game Invitations Routes

```typescript
// backend/src/routes/gameInvitationsRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  sendInvitation,
  getPendingInvitations,
  acceptInvitation,
  rejectInvitation
} from '../controllers/gameInvitationsController';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/game-invitations/send:
 *   post:
 *     summary: Envoyer une invitation de jeu
 *     tags: [Game Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to_user_id
 *               - session_code
 *             properties:
 *               to_user_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID de l'ami à inviter
 *               session_code:
 *                 type: string
 *                 description: Code de la session
 *                 example: ABC123
 *     responses:
 *       201:
 *         description: Invitation envoyée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 invitation:
 *                   $ref: '#/components/schemas/GameInvitation'
 *       400:
 *         description: Utilisateur non ami ou invitation déjà envoyée
 *       404:
 *         description: Session non trouvée
 */
router.post('/send', sendInvitation);

/**
 * @swagger
 * /api/v1/game-invitations/pending:
 *   get:
 *     summary: Récupérer les invitations en attente
 *     tags: [Game Invitations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invitations en attente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invitations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GameInvitation'
 */
router.get('/pending', getPendingInvitations);

/**
 * @swagger
 * /api/v1/game-invitations/accept:
 *   post:
 *     summary: Accepter une invitation
 *     tags: [Game Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invitation_id
 *             properties:
 *               invitation_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Invitation acceptée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 session_code:
 *                   type: string
 *                   description: Code de la session à rejoindre
 *       404:
 *         description: Invitation non trouvée ou expirée
 */
router.post('/accept', acceptInvitation);

/**
 * @swagger
 * /api/v1/game-invitations/reject:
 *   post:
 *     summary: Refuser une invitation
 *     tags: [Game Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invitation_id
 *             properties:
 *               invitation_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Invitation refusée
 *       404:
 *         description: Invitation non trouvée
 */
router.post('/reject', rejectInvitation);

export default router;
```

---

## 6. Schémas de données

Les schémas sont définis dans `swagger.ts` sous `components.schemas`. Pour les réutiliser :

```yaml
# Référencer un schéma existant
$ref: '#/components/schemas/User'

# Dans un array
type: array
items:
  $ref: '#/components/schemas/Session'
```

---

## 7. Authentification Bearer

### Configuration

Défini dans `swagger.ts` :

```typescript
securitySchemes: {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  },
},
```

### Utilisation par route

```typescript
/**
 * @swagger
 * /api/v1/protected-route:
 *   get:
 *     security:
 *       - bearerAuth: []
 */
```

### Test dans Swagger UI

1. Cliquer sur le bouton **Authorize** 🔒
2. Entrer le token : `Bearer <votre_token>`
3. Cliquer sur **Authorize**
4. Tester les routes protégées

---

## 8. Accès et utilisation

### Démarrer le serveur

```bash
cd backend
npm run dev
```

### URLs disponibles

| URL | Description |
|-----|-------------|
| `http://localhost:3001/api-docs` | Interface Swagger UI |
| `http://localhost:3001/api-docs.json` | Spec OpenAPI JSON |

### Fonctionnalités Swagger UI

- **Try it out** : Tester les endpoints directement
- **Models** : Voir tous les schémas de données
- **Authorize** : Configurer l'authentification Bearer
- **Download** : Exporter la spec OpenAPI

---

## 9. Bonnes pratiques

### Organisation

- Un tag par domaine fonctionnel (Auth, Sessions, etc.)
- Garder les schémas dans `swagger.ts`
- Documentation JSDoc au plus près du code

### Documentation complète

```typescript
/**
 * @swagger
 * /api/v1/resource:
 *   post:
 *     summary: Résumé court (1 ligne)
 *     description: |
 *       Description longue avec détails.
 *       Peut inclure du markdown.
 *     tags: [TagName]
 *     security:
 *       - bearerAuth: []      # Si authentification requise
 *     parameters:             # Query params, path params
 *       - in: query
 *         name: param
 *         schema:
 *           type: string
 *     requestBody:            # Pour POST/PUT/PATCH
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *     responses:
 *       200:
 *         description: Succès
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Non trouvé
 *       500:
 *         description: Erreur serveur
 */
```

### Exemples dans les schémas

Toujours inclure des `example` pour une meilleure lisibilité :

```typescript
properties: {
  email: {
    type: 'string',
    format: 'email',
    example: 'player@example.com',
  },
}
```

---

## 10. Dépannage

### "Swagger UI ne charge pas"

```bash
# Vérifier les dépendances
npm list swagger-jsdoc swagger-ui-express

# Réinstaller si nécessaire
npm install swagger-jsdoc swagger-ui-express
```

### "Routes non affichées"

1. Vérifier le chemin dans `apis` :

```typescript
apis: ['./src/routes/*.ts'],  // Depuis la racine backend
```

2. Vérifier que les fichiers compilent sans erreur :

```bash
npm run build
```

3. Vérifier la syntaxe JSDoc (pas d'erreur de YAML)

### "Erreur de parsing YAML"

- Vérifier l'indentation (2 espaces)
- Pas de tabulations
- Fermer toutes les balises

### "Schéma non trouvé"

Vérifier que le schéma est défini dans `components.schemas` :

```typescript
// ❌ Erreur
$ref: '#/components/schemas/Inexistant'

// ✅ Correct (schéma défini dans swagger.ts)
$ref: '#/components/schemas/User'
```

---

## 📊 Récapitulatif

| Catégorie | Routes | Statut |
|-----------|--------|--------|
| Auth | 5 | ✅ |
| Sessions | 4 | ✅ |
| Leaderboard | 3 | ✅ |
| Friends | 7 | ✅ |
| Game Invitations | 4 | ✅ |
| **Total** | **23** | **100%** |

---

## 🔗 Ressources

- [Swagger JSDoc](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI Express](https://www.npmjs.com/package/swagger-ui-express)
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [OpenAPI Examples](https://github.com/OAI/OpenAPI-Specification/tree/main/examples)

---