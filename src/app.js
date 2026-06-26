require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Route modules
const apodRoutes = require('./routes/apod');
const marsRoutes = require('./routes/mars');
const neoRoutes = require('./routes/neo');
const favoritesRoutes = require('./routes/favorites');

const app = express();

// ─── Security & Utility Middleware ──────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ─── Rate Limiting ────────────────────────────────────────────────────────
app.use('/api', rateLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    service: 'Space Explorer Dashboard API',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// ─── Swagger UI ───────────────────────────────────────────────────────────
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Space Explorer API — CAPS Tech Tank',
    customCss: '.swagger-ui .topbar { background-color: #1a1a2e; }',
  })
);

// ─── API Routes ───────────────────────────────────────────────────────────
const API_PREFIX = '/api/v1';
app.use(`${API_PREFIX}/apod`, apodRoutes);
app.use(`${API_PREFIX}/mars`, marsRoutes);
app.use(`${API_PREFIX}/neo`, neoRoutes);
app.use(`${API_PREFIX}/favorites`, favoritesRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    hint: 'Visit /api-docs for the full API reference',
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
