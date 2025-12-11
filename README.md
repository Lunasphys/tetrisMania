# 🎮 Tetris Mania - 1v1 Online Game

A full-stack TypeScript application for playing Tetris 1v1 online with real-time multiplayer, chat, leaderboards, and friend system.

## 🏗️ Architecture

### Backend
- **Node.js + Express** with TypeScript
- **Socket.io** for WebSocket real-time communication
- **Supabase** for authentication and PostgreSQL database
- **Swagger/OpenAPI** for API documentation
- **Jest** for unit testing

### Frontend
- **React + TypeScript** with Vite
- **Socket.io-client** for WebSocket connection
- **React Router** for navigation
- **Supabase JS Client** for authentication

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- Git

## 🚀 Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Supabase

1. Create a new project on [Supabase](https://supabase.com)
2. Go to Settings > API to get your:
   - Project URL
   - Anon/public key
   - Service role key (for backend)

3. Run the SQL schema in your Supabase SQL Editor (see `supabase/schema.sql`)

### 3. Backend Configuration

Create `backend/.env`:

```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
```

**Important**: The `SUPABASE_SERVICE_ROLE_KEY` is required for backend operations. It bypasses Row Level Security (RLS) policies, which is necessary since the backend validates authentication through middleware before database operations.

### 4. Frontend Configuration

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api-docs

## 🎮 Features

### Game Features
- **1v1 Tetris Battle**: Play Tetris against another player in real-time
- **Session System**: Create or join games with 6-character session codes
- **2 Players Only**: Each session supports exactly 2 players (no spectators)
- **Manual Start**: Player 1 must click "Start Game" after both players connect
- **Game Duration**: 2-minute time limit per game
- **Victory Conditions**: Win by having the highest score when opponent loses or time runs out
- **Real-time Sync**: WebSocket synchronization of game state
- **Chat**: Real-time chat within game sessions
- **Auto Score Saving**: Scores automatically saved to leaderboard when game ends

### User Features
- **Authentication**: Sign up, login, logout with Supabase Auth
- **Guest Mode**: Play without an account
- **Profile**: View your scores and friends
- **Leaderboard**: Global and personal score rankings
- **Friends System**: 
  - Send/accept/refuse friend requests
  - Search users by username (searches in `profiles.username` - the username set during signup)
  - Send friend requests by username (partial, case-insensitive matching)
  - View friend profiles with their scores
  - Remove friends
- **Game Invitations**: Invite friends to join your game session

**Note on Usernames**: The friend search uses the username stored in `profiles.username`, which is set during account creation. This may differ from the display name used in-game (which can be the email prefix or a guest username).

## 🧪 Testing

Run backend tests:

```bash
cd backend
npm test
```

Test coverage includes:
- Tetris game logic (rotation, collision, line clearing, scoring)
- Session management (join, leave, player limits)
- Business rules validation

## 📁 Project Structure

```
tetrisMania/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration (Supabase, Swagger)
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Auth middleware
│   │   ├── models/          # Data models and Tetris logic
│   │   ├── routes/          # Express routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions
│   │   ├── websocket/       # WebSocket handlers
│   │   ├── __tests__/       # Jest tests
│   │   └── index.ts         # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts (Auth)
│   │   ├── hooks/           # Custom hooks (useWebSocket)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── styles/          # CSS files
│   │   ├── config/          # Configuration
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Create account
- `POST /api/v1/auth/login` - Sign in
- `POST /api/v1/auth/logout` - Sign out
- `POST /api/v1/auth/forgot-password` - Request password reset
- `DELETE /api/v1/auth/delete-account` - Delete account

### Sessions
- `POST /api/v1/sessions` - Create game session
- `GET /api/v1/sessions/:code` - Get session info
- `GET /api/v1/sessions` - List active sessions
- `POST /api/v1/sessions/:code/join` - Join session

### Leaderboard
- `GET /api/v1/leaderboard` - Get global leaderboard
- `GET /api/v1/leaderboard/users/:id/scores` - Get user scores
- `POST /api/v1/leaderboard` - Save score

### Friends
- `POST /api/v1/friends/request` - Send friend request by user ID
- `POST /api/v1/friends/request-by-username` - Send friend request by username
- `POST /api/v1/friends/accept` - Accept request
- `POST /api/v1/friends/refuse` - Refuse request
- `GET /api/v1/friends` - Get friends list
- `GET /api/v1/friends/pending` - Get pending friend requests
- `GET /api/v1/friends/search?username=...` - Search users by username
- `DELETE /api/v1/friends/remove` - Remove a friend

### Game Invitations
- `POST /api/v1/game-invitations/send` - Send game invitation to a friend
- `GET /api/v1/game-invitations/pending` - Get pending game invitations
- `POST /api/v1/game-invitations/accept` - Accept game invitation
- `POST /api/v1/game-invitations/reject` - Reject game invitation

Full API documentation available at `/api-docs` when server is running.

## WebSocket Events

### Client → Server
- `join_session` - Join a game session
- `start_game` - Start the game (only player1 can emit this)
- `player_move` - Send game move (left, right, rotate, down, drop)
- `chat_message` - Send chat message
- `leave_session` - Leave session

### Server → Client
- `session_info` - Session information
- `both_players_ready` - Emitted when both players are connected (game not started yet)
- `game_started` - Emitted when player1 starts the game
- `game_state` - Game state update (contains full PlayerState)
- `game_finished` - Game ended (contains winner, scores, reason)
- `chat_message` - New chat message
- `player_joined` - Player joined notification
- `player_left` - Player left notification
- `error` - Error message

## 🗄️ Database Schema

See `supabase/schema.sql` for the complete database schema. Main tables:
- `profiles` - User profiles (extends Supabase Auth users)
- `scores` - Game scores
- `friend_requests` - Friend request system
- `game_invitations` - Game invitation system

## 🎨 Game Controls

- **← →** : Move piece left/right
- **↑** : Rotate piece
- **↓** : Soft drop
- **Space** : Hard drop

## 🐛 Troubleshooting

### Backend won't start
- Check that all environment variables are set in `backend/.env`
- Ensure Supabase credentials are correct
- Check that port 3001 is not in use

### Frontend connection issues
- Verify `VITE_API_URL` and `VITE_SOCKET_URL` in `frontend/.env`
- Check browser console for CORS errors
- Ensure backend is running

### WebSocket connection fails
- Check that Socket.io server is running on backend
- Verify CORS settings in `backend/src/websocket/gameSocket.ts`
- Check browser console for connection errors

## Notes

- Sessions are stored in-memory (use Redis for production)
- Guest users cannot use friends/leaderboard/invitations features
- Game state is synchronized via WebSocket
- Scores are automatically saved to Supabase database when game ends
- Game duration is 2 minutes - game ends automatically on timeout
- Winner is determined by highest score (or tie if equal scores)
- Only player1 (session creator) can invite friends to the session
- **Row Level Security (RLS)**: Backend uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS policies. Authentication is validated in middleware before database operations.
- **Username Search**: Friend search uses `profiles.username` (set during signup), not the in-game display name

## Production Deployment

For production:
1. Use environment-specific configuration
2. Replace in-memory session storage with Redis
3. Enable Supabase Row Level Security (RLS)
4. Set up proper CORS origins
5. Use HTTPS for WebSocket connections
6. Configure proper error logging and monitoring

## 📄 License

This project is for demonstration purposes.

