import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { securityHeaders, corsOptions } from './middleware/security';
import { generalRateLimit, authRateLimit, apiRateLimit } from './middleware/rate-limit';
import { authenticateToken } from './middleware/auth';
import { requireOrganization } from './middleware/organization';

// Routes
import authRoutes from './routes/auth';
import healthRoutes from './routes/health';
import usersRoutes from './routes/users';
import organizationsRoutes from './routes/organizations';

config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(generalRateLimit);

// Health check (no auth required)
app.use('/health', healthRoutes);

// Auth routes (stricter rate limiting)
app.use('/auth', authRateLimit, authRoutes);

// Protected routes
app.use('/api/v1/users', authenticateToken, requireOrganization, apiRateLimit, usersRoutes);
app.use('/api/v1/organizations', authenticateToken, requireOrganization, apiRateLimit, organizationsRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/auth`);
  console.log(`📡 API endpoints: http://localhost:${PORT}/api/v1`);
});

export default app;
