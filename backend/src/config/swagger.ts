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
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            username: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Session: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            player1_id: { type: 'string', nullable: true },
            player2_id: { type: 'string', nullable: true },
            player1_username: { type: 'string', nullable: true },
            player2_username: { type: 'string', nullable: true },
            spectators: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['waiting', 'playing', 'finished'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Score: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            user_id: { type: 'string', nullable: true },
            username: { type: 'string' },
            score: { type: 'number' },
            lines_cleared: { type: 'number' },
            session_code: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        FriendRequest: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            from_user_id: { type: 'string' },
            to_user_id: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'accepted', 'rejected'] },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

