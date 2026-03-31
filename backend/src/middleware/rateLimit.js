'use strict';

const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');

const defaultLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
  skip: () => env.IS_TEST,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later' },
  skip: () => env.IS_TEST,
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Search rate limit exceeded' },
  skip: () => env.IS_TEST,
});

module.exports = { defaultLimiter, authLimiter, searchLimiter };
