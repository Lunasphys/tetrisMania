# 📚 API Documentation - Tetris Mania Backend

Complete API documentation for frontend developers.

## 🌐 Base URL

```
http://localhost:3001/api/v1
```

Or in production:
```
https://your-backend-url.com/api/v1
```

## 🔐 Authentication

Most endpoints support both authenticated users and guests. When authenticated, include the Supabase JWT token in the Authorization header:

```
Authorization: Bearer <supabase_jwt_token>
```

---

## 📡 REST API Endpoints

### Authentication

#### `POST /api/v1/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "optional_username"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

**Error Responses:**
- `400` - Invalid email format or password too short
- `400` - Email already exists

---

#### `POST /api/v1/auth/login`
Sign in an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `400` - Missing email or password

---

#### `POST /api/v1/auth/logout`
Sign out current user (optional auth).

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

#### `POST /api/v1/auth/forgot-password`
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent"
}
```

**Error Responses:**
- `400` - Invalid email format

---

#### `DELETE /api/v1/auth/delete-account`
Delete user account (requires auth).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Account deletion requested. Data will be removed."
}
```

**Error Responses:**
- `401` - Authentication required

---

### Game Sessions

#### `POST /api/v1/sessions`
Create a new game session.

**Request Body (optional):**
```json
{
  "username": "PlayerName"
}
```

**Response (201):**
```json
{
  "message": "Session created successfully",
  "session": {
    "code": "ABC123",
    "player1_id": "guest_1234567890_abc",
    "player1_username": "PlayerName",
    "status": "waiting"
  },
  "playerId": "guest_1234567890_abc"
}
```

**Important:** Save the `playerId` returned - you'll need it for WebSocket connection!

**Error Responses:**
- `500` - Internal server error

---

#### `GET /api/v1/sessions/:code`
Get session information.

**Response (200):**
```json
{
  "session": {
    "code": "ABC123",
    "player1_id": "guest_1234567890_abc",
    "player2_id": null,
    "player1_username": "Player1",
    "player2_username": null,
    "spectators": [],
    "status": "waiting",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Session not found

---

#### `GET /api/v1/sessions`
List all active sessions.

**Response (200):**
```json
{
  "sessions": [
    {
      "code": "ABC123",
      "player1_id": "...",
      "status": "waiting",
      ...
    }
  ]
}
```

---

#### `POST /api/v1/sessions/:code/join`
Join an existing session.

**Request Body (optional):**
```json
{
  "username": "PlayerName"
}
```

**Response (200):**
```json
{
  "message": "Joined session successfully",
  "session": {
    "code": "ABC123",
    "player1_id": "...",
    "player2_id": "guest_9876543210_xyz",
    "status": "playing",
    ...
  },
  "role": "player2",
  "playerId": "guest_9876543210_xyz"
}
```

**Possible roles:**
- `player1` - First player (session creator)
- `player2` - Second player
- `spectator` - More than 2 players joined

**Important:** Save the `playerId` and `role` returned - you'll need them!

**Error Responses:**
- `400` - Session not found
- `400` - Failed to join session

---

### Leaderboard

#### `GET /api/v1/leaderboard`
Get global leaderboard.

**Query Parameters:**
- `limit` (optional, default: 100) - Number of scores to return

**Example:**
```
GET /api/v1/leaderboard?limit=50
```

**Response (200):**
```json
{
  "leaderboard": [
    {
      "id": "score-uuid",
      "user_id": "user-uuid",
      "username": "PlayerName",
      "score": 15000,
      "lines_cleared": 45,
      "session_code": "ABC123",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

#### `GET /api/v1/leaderboard/users/:id/scores`
Get user's score history (requires auth).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "scores": [
    {
      "id": "score-uuid",
      "user_id": "user-uuid",
      "username": "PlayerName",
      "score": 15000,
      "lines_cleared": 45,
      "session_code": "ABC123",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `403` - Access denied (can only view own scores)
- `401` - Authentication required

---

#### `POST /api/v1/leaderboard`
Save a score.

**Request Body:**
```json
{
  "score": 15000,
  "lines_cleared": 45,
  "session_code": "ABC123",
  "username": "PlayerName"
}
```

**Response (201):**
```json
{
  "message": "Score saved",
  "score": {
    "id": "score-uuid",
    "user_id": "user-uuid",
    "username": "PlayerName",
    "score": 15000,
    "lines_cleared": 45,
    "session_code": "ABC123",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Valid score is required

---

### Friends

#### `POST /api/v1/friends/request`
Send a friend request (requires auth).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "to_user_id": "user-uuid-to-add"
}
```

**Response (201):**
```json
{
  "message": "Friend request sent",
  "request": {
    "id": "request-uuid",
    "from_user_id": "your-user-id",
    "to_user_id": "target-user-id",
    "status": "pending",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid user ID
- `400` - Friend request already exists
- `401` - Authentication required

---

#### `POST /api/v1/friends/accept`
Accept a friend request (requires auth).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "request_id": "request-uuid"
}
```

**Response (200):**
```json
{
  "message": "Friend request accepted"
}
```

**Error Responses:**
- `404` - Friend request not found
- `401` - Authentication required

---

#### `POST /api/v1/friends/refuse`
Refuse a friend request (requires auth).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "request_id": "request-uuid"
}
```

**Response (200):**
```json
{
  "message": "Friend request refused"
}
```

**Error Responses:**
- `401` - Authentication required

---

#### `GET /api/v1/friends`
Get user's friends list (requires auth).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "friends": [
    {
      "id": "user-uuid",
      "email": "friend@example.com",
      "username": "FriendName"
    }
  ]
}
```

**Error Responses:**
- `401` - Authentication required

---

## 🔌 WebSocket API

### Connection

Connect to the WebSocket server:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket']
});
```

### Events: Client → Server

#### `join_session`
Join a game session via WebSocket.

**Payload:**
```json
{
  "sessionCode": "ABC123",
  "playerId": "guest_1234567890_abc",
  "username": "PlayerName"
}
```

**Important:** 
- Use the `playerId` returned from the REST API (`POST /sessions` or `POST /sessions/:code/join`)
- Use the same `playerId` for both REST and WebSocket!

---

#### `player_move`
Send a game move.

**Payload:**
```json
{
  "type": "left" | "right" | "rotate" | "down" | "drop",
  "playerId": "guest_1234567890_abc",
  "sessionCode": "ABC123"
}
```

**Move Types:**
- `left` - Move piece left
- `right` - Move piece right
- `rotate` - Rotate piece clockwise
- `down` - Soft drop (move down one cell)
- `drop` - Hard drop (instant drop to bottom)

---

#### `chat_message`
Send a chat message.

**Payload:**
```json
{
  "sessionCode": "ABC123",
  "userId": "guest_1234567890_abc",
  "username": "PlayerName",
  "message": "Hello!"
}
```

---

#### `leave_session`
Leave a session.

**Payload:**
```json
{
  "sessionCode": "ABC123",
  "playerId": "guest_1234567890_abc"
}
```

---

### Events: Server → Client

#### `connect`
Fired when WebSocket connection is established.

```javascript
socket.on('connect', () => {
  console.log('Connected to server');
  // Now you can emit join_session
});
```

---

#### `disconnect`
Fired when WebSocket connection is lost.

```javascript
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

---

#### `error`
Fired when an error occurs.

**Payload:**
```json
{
  "message": "Error description"
}
```

**Common Errors:**
- `"Session not found"` - Invalid session code
- Connection errors

---

#### `session_info`
Received when joining a session or when session info is updated.

**Payload:**
```json
{
  "session": {
    "code": "ABC123",
    "player1_id": "...",
    "player2_id": "...",
    "player1_username": "Player1",
    "player2_username": "Player2",
    "spectators": [],
    "status": "playing"
  },
  "role": "player1" | "player2" | "spectator"
}
```

**Important:** Update your UI based on the `role` received!

---

#### `game_state`
Received when joining as a player (initial game state).

**Payload:**
```json
{
  "userId": "guest_1234567890_abc",
  "username": "PlayerName",
  "grid": [[0, 0, 0, ...], ...], // 20x10 grid (0 = empty, 1 = block)
  "currentPiece": {
    "shape": [[1, 1], [1, 1]],
    "position": { "x": 4, "y": 0 },
    "type": "O",
    "rotation": 0
  },
  "nextPiece": { ... },
  "score": 0,
  "linesCleared": 0,
  "level": 0,
  "gameOver": false
}
```

---

#### `state_update`
Received when any player's game state is updated.

**Payload:**
```json
{
  "playerId": "guest_1234567890_abc",
  "state": {
    "userId": "guest_1234567890_abc",
    "username": "PlayerName",
    "grid": [[0, 0, 0, ...], ...],
    "currentPiece": { ... },
    "nextPiece": { ... },
    "score": 100,
    "linesCleared": 1,
    "level": 0,
    "gameOver": false
  }
}
```

**Important:** 
- If `playerId` matches your `playerId`, update your own game state
- Otherwise, update the opponent's game state

---

#### `chat_message`
Received when a chat message is sent.

**Payload:**
```json
{
  "id": "message-id",
  "sessionCode": "ABC123",
  "userId": "guest_1234567890_abc",
  "username": "PlayerName",
  "message": "Hello!",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

#### `player_joined`
Received when a player joins the session.

**Payload:**
```json
{
  "playerId": "guest_9876543210_xyz",
  "username": "NewPlayer",
  "role": "player2"
}
```

---

#### `player_left`
Received when a player leaves the session.

**Payload:**
```json
{
  "playerId": "guest_9876543210_xyz"
}
```

---

## 🎮 Game Flow Example

### Creating a Session

```javascript
// 1. Create session via REST
const response = await fetch('http://localhost:3001/api/v1/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'Player1' })
});
const { session, playerId } = await response.json();

// 2. Connect WebSocket
const socket = io('http://localhost:3001');
socket.on('connect', () => {
  // 3. Join session via WebSocket
  socket.emit('join_session', {
    sessionCode: session.code,
    playerId: playerId, // Use the playerId from REST response!
    username: 'Player1'
  });
});

// 4. Listen for game state
socket.on('game_state', (state) => {
  // Update your game UI
});

socket.on('state_update', ({ playerId, state }) => {
  if (playerId === myPlayerId) {
    // Update my game state
  } else {
    // Update opponent's game state
  }
});

// 5. Send moves
socket.emit('player_move', {
  type: 'left',
  playerId: myPlayerId,
  sessionCode: session.code
});
```

### Joining a Session

```javascript
// 1. Join session via REST
const response = await fetch(`http://localhost:3001/api/v1/sessions/${code}/join`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'Player2' })
});
const { session, role, playerId } = await response.json();

// 2. Connect WebSocket (same as above)
const socket = io('http://localhost:3001');
socket.on('connect', () => {
  socket.emit('join_session', {
    sessionCode: code,
    playerId: playerId, // Use the playerId from REST response!
    username: 'Player2'
  });
});

// 3. Handle role
socket.on('session_info', ({ role }) => {
  if (role === 'player2') {
    // You're the second player, can play
  } else if (role === 'spectator') {
    // You're a spectator, can only watch
  }
});
```

---

## ⚠️ Common Errors & Solutions

### "Session not found"
- **Cause:** Invalid session code or session expired
- **Solution:** Verify the session code, create a new session if needed

### "Failed to join session"
- **Cause:** Session is full (2 players already) or invalid code
- **Solution:** Check session status, try a different session

### "Authentication required"
- **Cause:** Endpoint requires authentication but no token provided
- **Solution:** Include `Authorization: Bearer <token>` header

### WebSocket connection fails
- **Cause:** Backend not running, wrong URL, or CORS issue
- **Solution:** 
  - Verify backend is running on correct port
  - Check WebSocket URL matches backend URL
  - Verify CORS is configured correctly

### Player becomes "spectator" instead of "player2"
- **Cause:** `playerId` mismatch between REST and WebSocket
- **Solution:** Always use the `playerId` returned from REST API for WebSocket connection

### "Failed to create session"
- **Cause:** Backend error or network issue
- **Solution:** Check backend logs, verify network connection

---

## 📝 Notes

1. **PlayerId Consistency:** Always use the `playerId` returned from REST API endpoints for WebSocket connections
2. **Session Codes:** 6-character alphanumeric codes (e.g., "ABC123")
3. **Guest Users:** Guest `playerId` format: `guest_<timestamp>_<random>`
4. **Game Grid:** 10 columns × 20 rows, values: `0` = empty, `1` = block
5. **Sessions:** Stored in-memory, will be lost on server restart (use Redis in production)

---

## 🔗 Additional Resources

- Swagger UI: `http://localhost:3001/api-docs` (when backend is running)
- Health Check: `http://localhost:3001/health`

---

## 📞 Support

If you encounter issues:
1. Check the error message - it should be descriptive
2. Check backend console logs
3. Verify all required fields are provided
4. Ensure `playerId` consistency between REST and WebSocket

