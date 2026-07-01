import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env, loadEnv, type EnvConfig } from './config.js';
import { initDatabase, parseDatabaseUrl, resetDatabase } from './db/index.js';
import { createApiKeyMiddleware } from './middleware/apiKey.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { rateLimitFromEnv } from './middleware/rateLimit.js';
import { analyticsRouter } from './routes/analytics.js';
import { createAnalyzeRouter } from './routes/analyze.js';
import { createDocsRouter } from './routes/docs.js';
import { exportRouter } from './routes/export.js';
import { favoritesRouter, feedbackRouter } from './routes/favorites.js';
import { healthRouter } from './routes/health.js';
import { historyRouter } from './routes/history.js';
import { metricsRouter } from './routes/metrics.js';
import { createKnowledgeRouter } from './routes/knowledge.js';
import { createStatusRouter } from './routes/status.js';
import { webhooksRouter } from './routes/webhooks.js';
import { resetAnalysisCaches } from './services/analyze.js';
import { initKnowledgeFromEnv } from './services/knowledge.js';
import { resetMetrics } from './services/metrics.js';
import { initWebhooksFromEnv } from './services/webhooks.js';

export interface CreateAppOptions {
  env?: EnvConfig;
  rateLimit?: { windowMs: number; max: number };
  skipRateLimit?: boolean;
  initDatabase?: boolean;
}

function buildExpressApp(appEnv: EnvConfig, options: CreateAppOptions): Express {
  initWebhooksFromEnv(appEnv);
  initKnowledgeFromEnv(appEnv);

  const app = express();
  const apiKey = createApiKeyMiddleware(appEnv);

  app.use(helmet());
  app.use(cors({ origin: appEnv.corsOrigin }));
  app.use(express.json({ limit: '5mb' }));

  app.use(healthRouter);
  app.use('/api/v1', createDocsRouter(appEnv));
  app.use('/api/v1', createStatusRouter(appEnv));
  app.use('/api/v1', metricsRouter);
  app.use('/api/v1', analyticsRouter);
  app.use('/api/v1', historyRouter);

  const limitConfig = options.rateLimit ?? {
    windowMs: appEnv.rateLimitWindowMs,
    max: appEnv.rateLimitMax,
  };

  const analyzeMiddleware = options.skipRateLimit
    ? (_req: express.Request, _res: express.Response, next: express.NextFunction) => next()
    : rateLimitFromEnv(limitConfig);

  app.use('/api/v1/analyze', apiKey, analyzeMiddleware, createAnalyzeRouter(appEnv));
  app.use('/api/v1', apiKey, exportRouter);
  app.use('/api/v1', apiKey, createKnowledgeRouter(appEnv));
  app.use('/api/v1', apiKey, webhooksRouter);
  app.use('/api/v1', apiKey, favoritesRouter);
  app.use('/api/v1', apiKey, feedbackRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export async function createApp(options: CreateAppOptions = {}): Promise<Express> {
  const appEnv = options.env ?? env;

  if (options.initDatabase !== false) {
    await resetDatabase();
    resetAnalysisCaches();
    resetMetrics();
    await initDatabase(appEnv.databaseUrl);
  }

  return buildExpressApp(appEnv, options);
}

export async function startServer() {
  await initDatabase(env.databaseUrl);
  const app = buildExpressApp(env, { skipRateLimit: false });

  const server = app.listen(env.port, () => {
    console.log(`SHIELD API listening on http://localhost:${env.port}`);
    console.log(`  Privacy mode: ${env.privacyMode}`);
    console.log(`  Demo mode: ${env.demoMode}`);
    console.log(`  API key auth: ${env.apiKeyRequired ? 'required' : 'disabled'}`);
    console.log(`  Database: ${parseDatabaseUrl(env.databaseUrl).dialect}`);
    console.log(`  Rate limit: ${env.rateLimitMax} req / ${env.rateLimitWindowMs}ms`);
  });

  const shutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(async () => {
      await resetDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return server;
}

export { loadEnv };
