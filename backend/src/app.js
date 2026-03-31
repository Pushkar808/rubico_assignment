'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const { env } = require('./config/env');
const { swaggerSpec } = require('./config/swagger');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/error');
const { defaultLimiter } = require('./middleware/rateLimit');

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || env.cors.origins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Parsing ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ───────────────────────────────────────────────────────────────────
if (!env.IS_TEST) {
  app.use(morgan(env.IS_PRODUCTION ? 'combined' : 'dev'));
}

// ─── Rate limiting ─────────────────────────────────────────────────────────────
app.use(defaultLimiter);

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env.NODE_ENV });
});

// ─── API Documentation ─────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Rubico API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
