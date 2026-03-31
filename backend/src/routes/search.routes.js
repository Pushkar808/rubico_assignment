'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/search.controller');
const { authenticate } = require('../middleware/auth');
const { searchLimiter } = require('../middleware/rateLimit');

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: AI-powered natural language search
 */

/**
 * @swagger
 * /search:
 *   get:
 *     tags: [Search]
 *     summary: Natural language search across events and products
 *     security: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *         description: Natural language search query
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [event, product] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 50 }
 *     responses:
 *       200:
 *         description: Ranked search results
 */
router.get(
  '/',
  searchLimiter,
  (req, res, next) => { authenticate(req, res, () => next()); },
  ctrl.search
);

module.exports = router;
