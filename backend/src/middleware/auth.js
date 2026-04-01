'use strict';

const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { sendUnauthorized, sendForbidden } = require('../utils/response.util');

/**
 * Verifies the JWT access token from Authorization header.
 * Attaches decoded user payload to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendUnauthorized(res, 'Authentication token required');
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendUnauthorized(res, 'Token expired');
    }
    return sendUnauthorized(res, 'Invalid token');
  }
}

/**
 * Verifies that the authenticated user is a member of the org
 * identified by req.params.orgId or req.body.orgId.
 * Attaches req.orgRole.
 */
async function requireOrgMember(req, res, next) {
  const { query } = require('../config/database');
  const orgId = req.params.orgId || req.body.org_id;

  if (!orgId) {
    return sendForbidden(res, 'Organization ID required');
  }

  try {
    const result = await query(
      `SELECT role FROM org_members WHERE org_id = $1 AND user_id = $2
       UNION ALL
       SELECT 'owner' AS role FROM organizations WHERE id = $1 AND owner_id = $2
       LIMIT 1`,
      [orgId, req.user.id]
    );

    if (result.rows.length === 0) {
      return sendForbidden(res, 'You are not a member of this organization');
    }

    req.orgRole = result.rows[0].role;
    req.orgId = orgId;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware factory: ensures req.orgRole is one of the allowed roles.
 */
function requireOrgRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.orgRole) {
      return sendForbidden(res, 'Organization role not determined');
    }
    const effective = req.orgRole === 'owner' ? 'owner' : req.orgRole;
    const permitted = allowedRoles.includes(effective) || effective === 'owner';
    if (!permitted) {
      return sendForbidden(res, 'Insufficient organization permissions');
    }
    next();
  };
}

module.exports = { authenticate, requireOrgMember, requireOrgRole };
