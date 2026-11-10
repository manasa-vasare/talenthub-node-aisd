import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { config } from './config/index.js';
import { initDb } from './db/connection.js';
import { runMigrations } from './db/migrate.js';
import { realtime } from './realtime/index.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import coordinatorRoutes from './routes/coordinatorRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize WebSockets
realtime.init(server);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (config.nodeEnv !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'TalentHub Placement Portal',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/coordinator', coordinatorRoutes);

// Static client hosting if built
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

async function startServer() {
  try {
    console.log('[Server] Initializing database...');
    await initDb();

    // Check if tables already exist and have data
    let hasData = false;
    try {
      const checkRes = await (await import('./db/connection.js')).query(
        "SELECT 1 FROM information_schema.tables WHERE table_name = 'users'"
      );
      if (checkRes.rows.length > 0) {
        const countRes = await (await import('./db/connection.js')).query("SELECT count(*) as c FROM users");
        hasData = Number(countRes.rows[0]?.c || 0) > 0;
      }
    } catch {
      hasData = false;
    }

    if (!hasData) {
      console.log('[Server] Database uninitialized. Running migrations and seed...');
      const { seedDatabase } = await import('./db/seed.js');
      await seedDatabase();
    } else {
      console.log('[Server] Database already initialized with active records.');
    }

    server.listen(config.port, () => {
      console.log(`================================================================`);
      console.log(`  TALENT HUB PLACEMENT PORTAL SERVER RUNNING`);
      console.log(`  HTTP API:   http://localhost:${config.port}/api`);
      console.log(`  WebSocket:  ws://localhost:${config.port}/ws`);
      console.log(`  Health:     http://localhost:${config.port}/api/health`);
      console.log(`================================================================`);
    });
  } catch (err) {
    console.error('Fatal server startup error:', err);
    process.exit(1);
  }
}

startServer();

export { app, server, startServer };

