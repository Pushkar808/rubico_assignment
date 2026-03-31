'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/feed.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Feed
 *   description: Mixed content feed
 */

/**
 * @swagger
 * /feed:
 *   get:
 *     tags: [Feed]
 *     summary: Get mixed feed of events and products
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 50 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [event, product] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [created_at, likes_count, saves_count], default: created_at }
 *     responses:
 *       200:
 *         description: Mixed feed items with pagination
 */
router.get(
  '/',
  (req, res, next) => {
    // Optional auth — attach user if token present
    authenticate(req, res, (err) => { next(); });
  },
  ctrl.getFeed
);

module.exports = router;
