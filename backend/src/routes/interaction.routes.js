'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/interaction.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Interactions
 *   description: User interactions - likes, saves, registrations
 */

router.use(authenticate);

/**
 * @swagger
 * /interactions/toggle:
 *   post:
 *     tags: [Interactions]
 *     summary: Toggle like/save/register on an event or product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [item_type, item_id, interaction_type]
 *             properties:
 *               item_type: { type: string, enum: [event, product] }
 *               item_id: { type: string, format: uuid }
 *               interaction_type: { type: string, enum: [like, save, register] }
 *     responses:
 *       200:
 *         description: Interaction toggled
 */
router.post('/toggle', ctrl.toggle);

/**
 * @swagger
 * /interactions/saved:
 *   get:
 *     tags: [Interactions]
 *     summary: Get list of saved items for the current user
 */
router.get('/saved', ctrl.getSaved);

module.exports = router;
