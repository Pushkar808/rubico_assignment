'use strict';

/**
 * Wraps async route handlers to automatically forward errors to next().
 * Eliminates try/catch boilerplate in controllers.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
