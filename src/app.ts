import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import { logger } from './core/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { defaultRateLimiter } from './middleware/rateLimiter';
import { healthRoutes } from './modules/health';

/**
 * Create and configure Express application
 */
export const createApp = (): Application => {
  const app = express();

  // Trust proxy (for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting
  app.use(defaultRateLimiter);

  // Request logging
  app.use((req, _res, next) => {
    logger.http(`${req.method} ${req.path}`);
    next();
  });

  // ============================================
  // Routes
  // ============================================

  // Health check routes (no prefix)
  app.use('/health', healthRoutes);

  // API routes with prefix
  const apiRouter = express.Router();

  // Mount your module routes here
  // Example: apiRouter.use('/users', userRoutes);
  // Example: apiRouter.use('/posts', postRoutes);

  app.use(config.apiPrefix, apiRouter);

  // ============================================
  // Error Handling
  // ============================================

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
};
