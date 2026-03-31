'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/organization.controller');
const { authenticate, requireOrgMember, requireOrgRole } = require('../middleware/auth');
const { validateBody, validateParams } = require('../middleware/validate');
const v = require('../validators/organization.validator');

/**
 * @swagger
 * tags:
 *   name: Organizations
 *   description: Organization management
 */

// All org routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /organizations:
 *   get:
 *     tags: [Organizations]
 *     summary: List organizations the current user belongs to
 *   post:
 *     tags: [Organizations]
 *     summary: Create a new organization
 */
router.get('/', ctrl.listMine);
router.post('/', validateBody(v.create), ctrl.create);

/**
 * @swagger
 * /organizations/{orgId}:
 *   get:
 *     tags: [Organizations]
 *     summary: Get organization details
 *   put:
 *     tags: [Organizations]
 *     summary: Update organization (admin/owner only)
 *   delete:
 *     tags: [Organizations]
 *     summary: Delete organization (owner only)
 */
router.get('/:orgId', validateParams(v.uuidParam), ctrl.getOne);

router.put(
  '/:orgId',
  validateParams(v.uuidParam),
  requireOrgMember,
  requireOrgRole('admin', 'owner'),
  validateBody(v.update),
  ctrl.update
);

router.delete(
  '/:orgId',
  validateParams(v.uuidParam),
  requireOrgMember,
  requireOrgRole('owner'),
  ctrl.remove
);

// Members sub-resource
router.get('/:orgId/members', validateParams(v.uuidParam), requireOrgMember, ctrl.getMembers);

router.post(
  '/:orgId/members',
  validateParams(v.uuidParam),
  requireOrgMember,
  requireOrgRole('admin', 'owner'),
  validateBody(v.addMember),
  ctrl.addMember
);

router.delete(
  '/:orgId/members/:memberId',
  requireOrgMember,
  requireOrgRole('admin', 'owner'),
  ctrl.removeMember
);

module.exports = router;
