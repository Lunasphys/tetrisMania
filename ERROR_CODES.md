# 🔴 Error Codes Reference

Complete list of all error codes returned by the API with explanations and solutions.

## 📋 Error Response Format

All errors follow this format:

```json
{
  "error": "Human-readable error message",
  "details": "Detailed explanation of what went wrong",
  "code": "ERROR_CODE"
}
```

---

## 🔐 Authentication Errors

### `AUTHENTICATION_REQUIRED`
**Status:** `401`  
**Message:** "Authentication required"  
**Details:** Endpoint requires authentication but no valid token was provided  
**Solution:** Include `Authorization: Bearer <token>` header with a valid Supabase JWT token

---

### `INVALID_CREDENTIALS`
**Status:** `401`  
**Message:** "Login failed"  
**Details:** The email or password is incorrect  
**Solution:** Verify email and password, check for typos

---

### `EMAIL_NOT_CONFIRMED`
**Status:** `401`  
**Message:** "Login failed"  
**Details:** Email address has not been verified  
**Solution:** Check inbox for confirmation email and verify account

---

## 📝 Validation Errors

### `MISSING_CREDENTIALS`
**Status:** `400`  
**Message:** "Missing required fields"  
**Details:** Email and/or password not provided  
**Solution:** Include both `email` and `password` in request body

---

### `INVALID_EMAIL_FORMAT`
**Status:** `400`  
**Message:** "Invalid email format"  
**Details:** Email address is not in valid format  
**Solution:** Use a valid email format (e.g., user@example.com)

---

### `PASSWORD_TOO_SHORT`
**Status:** `400`  
**Message:** "Password too short"  
**Details:** Password must be at least 6 characters  
**Solution:** Use a password with at least 6 characters

---

### `MISSING_SCORE`
**Status:** `400`  
**Message:** "Score is required"  
**Details:** Score value not provided  
**Solution:** Include `score` field in request body

---

### `INVALID_SCORE`
**Status:** `400`  
**Message:** "Invalid score value"  
**Details:** Score must be a non-negative integer  
**Solution:** Provide a valid number >= 0

---

### `MISSING_USER_ID`
**Status:** `400`  
**Message:** "User ID is required"  
**Details:** User ID not provided for friend request  
**Solution:** Include `to_user_id` in request body

---

### `MISSING_REQUEST_ID`
**Status:** `400`  
**Message:** "Request ID is required"  
**Details:** Friend request ID not provided  
**Solution:** Include `request_id` in request body

---

### `INVALID_SESSION_CODE`
**Status:** `400`  
**Message:** "Session code is required"  
**Details:** Session code missing or empty  
**Solution:** Provide a valid 6-character session code

---

### `INVALID_MOVE_REQUEST`
**Status:** `400` (WebSocket)  
**Message:** "Invalid move request"  
**Details:** Move request missing required fields  
**Solution:** Include `type`, `playerId`, and `sessionCode` in move payload

---

### `INVALID_MOVE_TYPE`
**Status:** `400` (WebSocket)  
**Message:** "Invalid move type"  
**Details:** Move type must be: left, right, rotate, down, or drop  
**Solution:** Use a valid move type

---

### `EMPTY_MESSAGE`
**Status:** `400` (WebSocket)  
**Message:** "Empty message"  
**Details:** Chat message cannot be empty  
**Solution:** Provide a non-empty message

---

### `MESSAGE_TOO_LONG`
**Status:** `400` (WebSocket)  
**Message:** "Message too long"  
**Details:** Chat message exceeds 500 characters  
**Solution:** Shorten message to 500 characters or less

---

## 🎮 Session Errors

### `SESSION_NOT_FOUND`
**Status:** `404`  
**Message:** "Session not found"  
**Details:** No session exists with the provided code  
**Possible Causes:**
- Session code is incorrect
- Session expired or was closed
- Session was never created

**Solution:**
- Verify the session code is correct (6 alphanumeric characters)
- Create a new session if needed
- Check if session still exists via `GET /sessions/:code`

---

### `SESSION_CREATE_ERROR`
**Status:** `500`  
**Message:** "Failed to create game session"  
**Details:** Internal error while creating session  
**Solution:** Check backend logs, verify server is running correctly

---

### `SESSION_JOIN_ERROR`
**Status:** `400`  
**Message:** "Failed to join session"  
**Details:** Error occurred while joining session  
**Solution:** Verify session code, check if session is full (2 players already)

---

### `SESSION_FULL`
**Status:** `400`  
**Message:** "Session is full"  
**Details:** Session already has 2 players, cannot join  
**Solution:** Create a new session or wait for a player to leave

---

### `SESSION_GET_ERROR`
**Status:** `500`  
**Message:** "Failed to retrieve session"  
**Details:** Internal error while fetching session  
**Solution:** Check backend logs

---

## 🎯 Game Errors

### `GAME_STATE_NOT_INITIALIZED`
**Status:** `400` (WebSocket)  
**Message:** "Game state not initialized"  
**Details:** Player's game state has not been initialized  
**Solution:** Rejoin the session via WebSocket `join_session` event

---

## 👥 Friends Errors

### `CANNOT_ADD_SELF`
**Status:** `400`  
**Message:** "Cannot add yourself as a friend"  
**Details:** Attempted to send friend request to own user ID  
**Solution:** Use a different user ID

---

### `FRIEND_REQUEST_EXISTS`
**Status:** `400`  
**Message:** "Friend request already exists"  
**Details:** A friend request already exists between these users  
**Possible Statuses:**
- `pending` - Request is waiting for response
- `accepted` - Users are already friends
- `rejected` - Request was previously rejected

**Solution:** Check the `currentStatus` field in error response

---

### `FRIEND_REQUEST_NOT_FOUND`
**Status:** `404`  
**Message:** "Friend request not found"  
**Details:** No pending friend request found with provided ID  
**Solution:** Verify request ID, check if request was already processed

---

### `FRIEND_REQUEST_CREATE_ERROR`
**Status:** `500`  
**Message:** "Failed to send friend request"  
**Details:** Database error while creating friend request  
**Solution:** Check backend logs, verify database connection

---

### `FRIEND_REQUEST_ACCEPT_ERROR`
**Status:** `500`  
**Message:** "Failed to accept friend request"  
**Details:** Database error while accepting request  
**Solution:** Check backend logs

---

### `FRIEND_REQUEST_REFUSE_ERROR`
**Status:** `500`  
**Message:** "Failed to refuse friend request"  
**Details:** Database error while refusing request  
**Solution:** Check backend logs

---

### `FRIENDS_FETCH_ERROR`
**Status:** `500`  
**Message:** "Failed to fetch friends list"  
**Details:** Database error while retrieving friends  
**Solution:** Check backend logs

---

### `FRIEND_DETAILS_FETCH_ERROR`
**Status:** `500`  
**Message:** "Failed to fetch friend details"  
**Details:** Database error while retrieving friend user information  
**Solution:** Check backend logs

---

### `MISSING_USERNAME`
**Status:** `400`  
**Message:** "Username is required"  
**Details:** Username not provided for friend request by username  
**Solution:** Include `username` in request body

---

### `USER_NOT_FOUND`
**Status:** `404`  
**Message:** "User not found"  
**Details:** No user found with the provided username  
**Solution:** Verify username is correct, check for typos

---

### `MISSING_SEARCH_PARAM`
**Status:** `400`  
**Message:** "Search parameter required"  
**Details:** Username or email not provided for search  
**Solution:** Include `username` or `email` query parameter

---

### `USER_SEARCH_ERROR`
**Status:** `500`  
**Message:** "Failed to search users"  
**Details:** Database error while searching for users  
**Solution:** Check backend logs

---

### `FRIEND_REMOVE_ERROR`
**Status:** `500`  
**Message:** "Failed to remove friend"  
**Details:** Database error while removing friend relationship  
**Solution:** Check backend logs

---

## 🎮 Game Invitations Errors

### `MISSING_SESSION_CODE`
**Status:** `400`  
**Message:** "Session code is required"  
**Details:** Session code not provided for game invitation  
**Solution:** Include `session_code` in request body

---

### `NOT_SESSION_CREATOR`
**Status:** `403`  
**Message:** "Not authorized"  
**Details:** Only the session creator (player1) can invite friends  
**Solution:** Only player1 can send invitations

---

### `CANNOT_INVITE_SELF`
**Status:** `400`  
**Message:** "Cannot invite yourself"  
**Details:** Attempted to send game invitation to yourself  
**Solution:** Invite a different user

---

### `INVITATION_EXISTS`
**Status:** `400`  
**Message:** "Invitation already sent"  
**Details:** A pending invitation already exists for this user and session  
**Solution:** Wait for the existing invitation to be accepted or rejected

---

### `INVITATION_CREATE_ERROR`
**Status:** `500`  
**Message:** "Failed to send game invitation"  
**Details:** Database error while creating invitation  
**Solution:** Check backend logs

---

### `INVITATIONS_FETCH_ERROR`
**Status:** `500`  
**Message:** "Failed to fetch invitations"  
**Details:** Database error while retrieving invitations  
**Solution:** Check backend logs

---

### `MISSING_INVITATION_ID`
**Status:** `400`  
**Message:** "Invitation ID is required"  
**Details:** Invitation ID not provided  
**Solution:** Include `invitation_id` in request body

---

### `INVITATION_NOT_FOUND`
**Status:** `404`  
**Message:** "Invitation not found"  
**Details:** No pending invitation found with provided ID  
**Solution:** Verify invitation ID, check if already processed

---

### `SESSION_EXPIRED`
**Status:** `404`  
**Message:** "Session expired"  
**Details:** The game session for this invitation no longer exists  
**Solution:** The invitation will be marked as expired automatically

---

### `INVITATION_ACCEPT_ERROR`
**Status:** `500`  
**Message:** "Failed to accept invitation"  
**Details:** Database error while accepting invitation  
**Solution:** Check backend logs

---

### `INVITATION_REJECT_ERROR`
**Status:** `500`  
**Message:** "Failed to reject invitation"  
**Details:** Database error while rejecting invitation  
**Solution:** Check backend logs

---

### `SESSION_FULL`
**Status:** `400`  
**Message:** "Session is full"  
**Details:** Session already has 2 players, cannot join  
**Solution:** Create a new session or wait for a player to leave

---

## 📊 Leaderboard Errors

### `LEADERBOARD_FETCH_ERROR`
**Status:** `500`  
**Message:** "Failed to fetch leaderboard"  
**Details:** Database error while retrieving scores  
**Solution:** Check backend logs, verify database connection

---

### `USER_SCORES_FETCH_ERROR`
**Status:** `500`  
**Message:** "Failed to fetch user scores"  
**Details:** Database error while retrieving user scores  
**Solution:** Check backend logs

---

### `SCORE_SAVE_ERROR`
**Status:** `500`  
**Message:** "Failed to save score"  
**Details:** Database error while saving score  
**Solution:** Check backend logs, verify database connection

---

## 🔒 Access Control Errors

### `ACCESS_DENIED`
**Status:** `403`  
**Message:** "Access denied"  
**Details:** User attempted to access resource they don't have permission for  
**Example:** Trying to view another user's scores  
**Solution:** Only access your own resources, or ensure you have proper permissions

---

## ⚠️ Account Errors

### `EMAIL_ALREADY_EXISTS`
**Status:** `409`  
**Message:** "Failed to create account"  
**Details:** Email address is already registered  
**Solution:** Use a different email or sign in with existing account

---

### `SIGNUP_ERROR`
**Status:** `400`  
**Message:** "Failed to create account"  
**Details:** General signup error (check `supabaseError` field)  
**Solution:** Check error details, verify email format and password requirements

---

### `LOGIN_ERROR`
**Status:** `401`  
**Message:** "Login failed"  
**Details:** General login error  
**Solution:** Check `supabaseError` field for specific issue

---

### `PASSWORD_RESET_ERROR`
**Status:** `400`  
**Message:** "Failed to send password reset email"  
**Details:** Error sending password reset email  
**Solution:** Verify email address, check Supabase configuration

---

## 🔌 WebSocket Errors

### `INVALID_LEAVE_REQUEST`
**Status:** `400` (WebSocket)  
**Message:** "Invalid leave request"  
**Details:** Leave request missing required fields  
**Solution:** Include both `sessionCode` and `playerId` in leave request

---

## 🗄️ Database Errors

All database errors include a `supabaseError` field with the original Supabase error message.

Common Supabase errors:
- Connection issues
- Row Level Security (RLS) policy violations
- Foreign key constraint violations
- Unique constraint violations

---

## 🔧 Internal Errors

### `INTERNAL_ERROR`
**Status:** `500`  
**Message:** "Internal server error"  
**Details:** Unexpected error occurred  
**Solution:** Check backend logs, report issue if persistent

---

## 📝 Error Handling Best Practices

1. **Always check the `code` field** for programmatic error handling
2. **Read the `details` field** for human-readable explanations
3. **Check additional fields** for context (e.g., `providedCode`, `currentStatus`)
4. **Log errors** on the frontend for debugging
5. **Display user-friendly messages** based on error codes
6. **Handle network errors** separately (connection issues, timeouts)

---

## 🎯 Example Error Handling

```javascript
try {
  const response = await fetch('/api/v1/sessions/ABC123/join', {
    method: 'POST',
    body: JSON.stringify({ username: 'Player' })
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    switch (error.code) {
      case 'SESSION_NOT_FOUND':
        alert(`Session ${error.providedCode} not found. Please check the code.`);
        break;
      case 'INVALID_SESSION_CODE':
        alert('Please provide a valid session code');
        break;
      default:
        alert(`Error: ${error.details || error.error}`);
    }
    return;
  }
  
  const data = await response.json();
  // Handle success
} catch (error) {
  console.error('Network error:', error);
  alert('Failed to connect to server');
}
```

---

## 🔍 Debugging Tips

1. **Check browser console** for detailed error messages
2. **Check backend console** for server-side logs (prefixed with `[ControllerName]` or `[WebSocket]`)
3. **Verify request format** matches API documentation
4. **Check authentication** if getting 401 errors
5. **Verify session exists** if getting 404 errors
6. **Check database connection** if getting 500 errors

