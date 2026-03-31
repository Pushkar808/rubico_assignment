'use strict';

const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/event.controller');
const { authenticate, requireOrgMember, requireOrgRole } = require('../middleware/auth');
const { validateBody, validateQuery, validateParams } = require('../middleware/validate');
const v = require('../validators/event.validator');

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management
 */

// GET /events/:id — public (optional auth for interaction status)
router.get(
  '/:id',
  (req, res, next) => { authenticate(req, res, (err) => { if (!err) return next(); next(); }); },
  validateParams(v.uuidParam),
  ctrl.getOne
);

// Org-scoped routes: /organizations/:orgId/events
router.get(
  '/',
  authenticate,
  requireOrgMember,
  validateQuery(v.listQuery),
  ctrl.listByOrg
);

router.post(
  '/',
  authenticate,
  requireOrgMember,
  requireOrgRole('admin', 'member', 'owner'),
  validateBody(v.create),
  ctrl.create
);

router.put(
  '/:id',
  authenticate,
  requireOrgMember,
  requireOrgRole('admin', 'member', 'owner'),
  validateParams(v.uuidParam),
  validateBody(v.update),
  ctrl.update
);

router.delete(
  '/:id',
  authenticate,
  requireOrgMember,
  requireOrgRole('admin', 'owner'),
  validateParams(v.uuidParam),
  ctrl.remove
);

module.exports = router;
