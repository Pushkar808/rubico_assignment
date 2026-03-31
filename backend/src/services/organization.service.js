'use strict';

const { query, transaction } = require('../config/database');

async function create(ownerId, { name, description, website, logo_url }) {
  return transaction(async (client) => {
    const orgResult = await client.query(
      `INSERT INTO organizations (name, description, website, logo_url, owner_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description || null, website || null, logo_url || null, ownerId]
    );
    const org = orgResult.rows[0];

    // Owner is always also a member
    await client.query(
      `INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [org.id, ownerId]
    );

    return org;
  });
}

async function list(userId) {
  const result = await query(
    `SELECT o.*, om.role AS member_role
     FROM organizations o
     JOIN org_members om ON om.org_id = o.id
     WHERE om.user_id = $1
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function getById(orgId, userId) {
  const result = await query(
    `SELECT o.*,
       (SELECT COUNT(*) FROM events WHERE org_id = o.id AND status = 'published') AS events_count,
       (SELECT COUNT(*) FROM products WHERE org_id = o.id AND status = 'active') AS products_count,
       (SELECT role FROM org_members WHERE org_id = o.id AND user_id = $2) AS member_role
     FROM organizations o
     WHERE o.id = $1`,
    [orgId, userId]
  );
  if (result.rows.length === 0) {
    const err = new Error('Organization not found');
    err.status = 404;
    throw err;
  }
  return result.rows[0];
}

async function update(orgId, updates) {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, val] of Object.entries(updates)) {
    if (['name', 'description', 'website', 'logo_url'].includes(key)) {
      fields.push(`${key} = $${idx++}`);
      values.push(val === '' ? null : val);
    }
  }

  if (fields.length === 0) return getById(orgId, null);

  values.push(orgId);
  const result = await query(
    `UPDATE organizations SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${idx}
     RETURNING *`,
    values
  );
  return result.rows[0];
}

async function remove(orgId) {
  await query('DELETE FROM organizations WHERE id = $1', [orgId]);
}

async function getMembers(orgId) {
  const result = await query(
    `SELECT u.id, u.name, u.email, u.avatar_url, om.role, om.created_at AS joined_at
     FROM org_members om
     JOIN users u ON u.id = om.user_id
     WHERE om.org_id = $1
     ORDER BY om.created_at ASC`,
    [orgId]
  );
  return result.rows;
}

async function addMember(orgId, email, role) {
  const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (userResult.rows.length === 0) {
    const err = new Error('User with that email not found');
    err.status = 404;
    throw err;
  }

  const userId = userResult.rows[0].id;

  // Check if already a member
  const existing = await query(
    'SELECT id FROM org_members WHERE org_id = $1 AND user_id = $2',
    [orgId, userId]
  );
  if (existing.rows.length > 0) {
    const err = new Error('User is already a member of this organization');
    err.status = 409;
    throw err;
  }

  await query(
    'INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, $3)',
    [orgId, userId, role]
  );

  return { userId, role };
}

async function removeMember(orgId, memberId, requesterId) {
  if (memberId === requesterId) {
    const err = new Error('Cannot remove yourself');
    err.status = 400;
    throw err;
  }

  // Cannot remove the owner
  const org = await query('SELECT owner_id FROM organizations WHERE id = $1', [orgId]);
  if (org.rows[0]?.owner_id === memberId) {
    const err = new Error('Cannot remove the organization owner');
    err.status = 400;
    throw err;
  }

  await query(
    'DELETE FROM org_members WHERE org_id = $1 AND user_id = $2',
    [orgId, memberId]
  );
}

module.exports = { create, list, getById, update, remove, getMembers, addMember, removeMember };
