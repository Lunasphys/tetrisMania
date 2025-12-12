import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tetris Mania API',
      version: '1.0.0',
      description: `
        API for Tetris 1v1 online multiplayer game.
        
        ## Features
        - User authentication (signup, login, password reset)
        - Game session management (create, join, play)
        - Real-time gameplay via WebSocket
        - Leaderboard and score tracking
        - Friend system (add, accept, remove friends)
        - Game invitations to friends
        
        ## Authentication
        Most endpoints require authentication via Bearer token.
        After login/signup, include the token in the Authorization header:
        \`Authorization: Bearer YOUR_TOKEN_HERE\`
        
        ## WebSocket Events
        Real-time game communication uses Socket.IO on the same port.
        Connect to: \`ws://localhost:3001\`
        
        Key events:
        - \`join_session\` - Join a game session
        - \`start_game\` - Start the game (player1 only)
        - \`player_move\` - Send game moves
        - \`chat_message\` - Send chat messages
        - \`game_state\` - Receive game state updates
        - \`game_finished\` - Game end notification
      `,
      contact: {
        name: 'Tetris Mania Support',
        email: 'support@tetrismania.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}`,
        description: 'Development server',
      },
      {
        url: `http://0.0.0.0:${process.env.PORT || 3001}`,
        description: 'Network access (local network)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token from login/signup',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User unique identifier (UUID)',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'player@example.com',
            },
            username: {
              type: 'string',
              description: 'User display name',
              example: 'ProGamer42',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
              example: '2024-01-15T10:30:00Z',
            },
          },
        },
        Session: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: '6-character uppercase session code',
              example: 'ABC123',
              minLength: 6,
              maxLength: 6,
            },
            player1_id: {
              type: 'string',
              nullable: true,
              description: 'Player 1 user ID (session creator)',
              example: 'user_abc123',
            },
            player2_id: {
              type: 'string',
              nullable: true,
              description: 'Player 2 user ID',
              example: 'user_xyz789',
            },
            player1_username: {
              type: 'string',
              nullable: true,
              description: 'Player 1 display name',
              example: 'Player1',
            },
            player2_username: {
              type: 'string',
              nullable: true,
              description: 'Player 2 display name',
              example: 'Player2',
            },
            spectators: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of spectator user IDs (currently not used)',
              example: [],
            },
            status: {
              type: 'string',
              enum: ['waiting', 'playing', 'finished'],
              description: 'Current session status',
              example: 'waiting',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Session creation timestamp',
              example: '2024-01-15T14:30:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
              example: '2024-01-15T14:35:00Z',
            },
          },
        },
        Score: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Score record ID (UUID)',
              example: 'score_abc123',
            },
            user_id: {
              type: 'string',
              nullable: true,
              description: 'User ID (null for guest players)',
              example: 'user_abc123',
            },
            username: {
              type: 'string',
              description: 'Player display name',
              example: 'ProGamer42',
            },
            score: {
              type: 'integer',
              description: 'Total score achieved',
              example: 5000,
              minimum: 0,
            },
            lines_cleared: {
              type: 'integer',
              description: 'Number of lines cleared',
              example: 25,
              minimum: 0,
            },
            session_code: {
              type: 'string',
              nullable: true,
              description: 'Associated session code (if from multiplayer game)',
              example: 'ABC123',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Score creation timestamp',
              example: '2024-01-15T14:45:00Z',
            },
          },
        },
        FriendRequest: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Friend request ID (UUID)',
              example: 'req_abc123',
            },
            from_user_id: {
              type: 'string',
              description: 'Sender user ID',
              example: 'user_abc123',
            },
            to_user_id: {
              type: 'string',
              description: 'Receiver user ID',
              example: 'user_xyz789',
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'rejected'],
              description: 'Request status',
              example: 'pending',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Request creation timestamp',
              example: '2024-01-15T10:00:00Z',
            },
          },
        },
        GameInvitation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Invitation ID (UUID)',
              example: 'inv_abc123',
            },
            from_user_id: {
              type: 'string',
              description: 'Sender user ID (session creator)',
              example: 'user_abc123',
            },
            to_user_id: {
              type: 'string',
              description: 'Receiver user ID (invited friend)',
              example: 'user_xyz789',
            },
            session_code: {
              type: 'string',
              description: 'Game session code',
              example: 'ABC123',
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'rejected', 'expired'],
              description: 'Invitation status',
              example: 'pending',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Invitation creation timestamp',
              example: '2024-01-15T14:00:00Z',
            },
          },
        },
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Authentication required',
            },
            details: {
              type: 'string',
              description: 'Detailed error information',
              example: 'You must be logged in to access this resource',
            },
            code: {
              type: 'string',
              description: 'Error code for client-side handling',
              example: 'AUTHENTICATION_REQUIRED',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message',
              example: 'Operation completed successfully',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'User authentication and account management',
      },
      {
        name: 'Sessions',
        description: 'Game session creation and management',
      },
      {
        name: 'Leaderboard',
        description: 'Score tracking and leaderboard',
      },
      {
        name: 'Friends',
        description: 'Friend system - add, search, manage friends',
      },
      {
        name: 'Game Invitations',
        description: 'Invite friends to join your game sessions',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);