'use strict';

const { env } = require('../config/env');

/**
 * Centralized error handling middleware.
 * Must be registered LAST in Express middleware chain.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || undefined;

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // unique violation
        status = 409;
        message = 'A record with that value already exists';
        break;
      case '23503': // foreign key violation
        status = 400;
        message = 'Referenced resource does not exist';
        break;
      case '23502': // not null violation
        status = 400;
        message = `Required field missing: ${err.column || 'unknown'}`;
        break;
      case '22P02': // invalid input syntax
        status = 400;
        message = 'Invalid data format';
        break;
      default:
        break;
    }
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    status = 422;
    message = 'Validation failed';
    errors = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  }

  if (!env.IS_PRODUCTION) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);
  }

  res.status(status).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(!env.IS_PRODUCTION && err.stack && { stack: err.stack.split('\n').slice(0, 5) }),
  });
}

function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
}

module.exports = { errorHandler, notFound };
