'use strict';

const { query } = require('../config/database');

const VALID_TYPES = ['event', 'product'];
const VALID_INTERACTIONS = ['like', 'save', 'register'];

async function toggle(userId, itemType, itemId, interactionType) {
  if (!VALID_TYPES.includes(itemType)) {
    const err = new Error('Invalid item type');
    err.status = 400;
    throw err;
  }
  if (!VALID_INTERACTIONS.includes(interactionType)) {
    const err = new Error('Invalid interaction type');
    err.status = 400;
    throw err;
  }
  if (interactionType === 'register' && itemType !== 'event') {
    const err = new Error('Registration is only available for events');
    err.status = 400;
    throw err;
  }

  // Verify item exists
  const table = itemType === 'event' ? 'events' : 'products';
  const itemResult = await query(`SELECT id, capacity, registered_count FROM ${table} WHERE id = $1`, [itemId]);
  if (itemResult.rows.length === 0) {
    const err = new Error(`${itemType} not found`);
    err.status = 404;
    throw err;
  }

  // Check capacity for event registration
  if (interactionType === 'register') {
    const item = itemResult.rows[0];
    if (item.capacity !== null && item.registered_count >= item.capacity) {
      const err = new Error('Event is at full capacity');
      err.status = 409;
      throw err;
    }
  }

  // Check if interaction already exists
  const existing = await query(
    `SELECT id FROM interactions
     WHERE user_id = $1 AND item_type = $2 AND item_id = $3 AND interaction_type = $4`,
    [userId, itemType, itemId, interactionType]
  );

  if (existing.rows.length > 0) {
    // Remove (toggle off)
    await query(
      `DELETE FROM interactions
       WHERE user_id = $1 AND item_type = $2 AND item_id = $3 AND interaction_type = $4`,
      [userId, itemType, itemId, interactionType]
    );
    return { action: 'removed', interactionType };
  } else {
    // Add (toggle on)
    await query(
      `INSERT INTO interactions (user_id, item_type, item_id, interaction_type)
       VALUES ($1, $2, $3, $4)`,
      [userId, itemType, itemId, interactionType]
    );
    return { action: 'added', interactionType };
  }
}

async function getUserInteractions(userId, itemIds, itemType) {
  if (!itemIds || itemIds.length === 0) return {};

  const result = await query(
    `SELECT item_id, interaction_type
     FROM interactions
     WHERE user_id = $1 AND item_type = $2 AND item_id = ANY($3::uuid[])`,
    [userId, itemType, itemIds]
  );

  const map = {};
  for (const row of result.rows) {
    const id = row.item_id;
    if (!map[id]) map[id] = {};
    map[id][row.interaction_type] = true;
  }
  return map;
}

async function getUserSaved(userId, { page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;

  const countResult = await query(
    `SELECT COUNT(*) FROM interactions
     WHERE user_id = $1 AND interaction_type = 'save'`,
    [userId]
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await query(
    `SELECT
       i.item_type, i.item_id, i.created_at AS saved_at,
       CASE i.item_type
         WHEN 'event'   THEN e.title
         WHEN 'product' THEN p.title
       END AS title,
       CASE i.item_type
         WHEN 'event'   THEN e.image_url
         WHEN 'product' THEN p.image_url
       END AS image_url,
       CASE i.item_type
         WHEN 'event'   THEN e.category
         WHEN 'product' THEN p.category
       END AS category
     FROM interactions i
     LEFT JOIN events   e ON e.id = i.item_id AND i.item_type = 'event'
     LEFT JOIN products p ON p.id = i.item_id AND i.item_type = 'product'
     WHERE i.user_id = $1 AND i.interaction_type = 'save'
     ORDER BY i.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return { items: result.rows, total };
}

module.exports = { toggle, getUserInteractions, getUserSaved };
