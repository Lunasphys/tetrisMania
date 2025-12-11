import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/authRoutes';
import sessionRoutes from './routes/sessionRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';
import friendsRoutes from './routes/friendsRoutes';
import gameInvitationsRoutes from './routes/gameInvitationsRoutes';
import { initializeGameSocket } from './websocket/gameSocket';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/friends', friendsRoutes);
app.use('/api/v1/game-invitations', gameInvitationsRoutes);

// Initialize WebSocket
initializeGameSocket(server);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🌐 Network access: http://0.0.0.0:${PORT}`);
});

