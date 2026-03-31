'use strict';

require('dotenv').config();

const { validateEnv } = require('./config/env');
const { env } = require('./config/env');
const { testConnection } = require('./config/database');

// Validate environment variables before starting
validateEnv();

const app = require('./app');

async function start() {
  try {
    await testConnection();

    const server = app.listen(env.PORT, () => {
      console.log(`✓ Server running on port ${env.PORT} [${env.NODE_ENV}]`);
      console.log(`  API:  http://localhost:${env.PORT}/api/v1`);
      console.log(`  Docs: http://localhost:${env.PORT}/api-docs`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        const { closePool } = require('./config/database');
        await closePool();
        console.log('✓ Database pool closed');
        process.exit(0);
      });

      // Force exit after 10s
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason);
    });

  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
