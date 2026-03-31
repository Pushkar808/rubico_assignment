'use strict';

/**
 * Wraps a Zod schema into an Express middleware that validates req.body.
 * Passes a ZodError to next() on failure so the error handler catches it.
 */
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(result.error);
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates req.query against a Zod schema.
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(result.error);
    }
    req.query = result.data;
    next();
  };
}

/**
 * Validates req.params against a Zod schema.
 */
function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(result.error);
    }
    req.params = result.data;
    next();
  };
}

module.exports = { validateBody, validateQuery, validateParams };
