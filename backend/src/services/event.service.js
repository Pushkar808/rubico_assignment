'use strict';

const { query } = require('../config/database');
const { generateEmbedding, buildEmbeddingText } = require('../utils/embedding.util');

async function create(orgId, data) {
  const {
    title, description, category, tags, location,
    is_virtual, start_date, end_date, price, capacity, image_url, status,
  } = data;

  const result = await query(
    `INSERT INTO events
       (org_id, title, description, category, tags, location, is_virtual,
        start_date, end_date, price, capacity, image_url, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      orgId, title, description || null, category || null,
      tags, location || null, is_virtual,
      start_date || null, end_date || null,
      price, capacity || null, image_url || null, status,
    ]
  );

  const event = result.rows[0];

  // Async embedding generation (non-blocking)
  _generateAndStoreEmbedding('events', event.id, event).catch(() => {});

  return event;
}

async function list(orgId, { page, limit, category, status, sort, order, search }) {
  const offset = (page - 1) * limit;
  const conditions = ['e.org_id = $1'];
  const values = [orgId];
  let idx = 2;

  if (status) { conditions.push(`e.status = $${idx++}`); values.push(status); }
  if (category) { conditions.push(`e.category = $${idx++}`); values.push(category); }
  if (search) {
    conditions.push(`e.search_vector @@ plainto_tsquery('english', $${idx++})`);
    values.push(search);
  }

  const where = conditions.join(' AND ');
  const allowedSort = ['created_at', 'start_date', 'likes_count', 'updated_at'];
  const sortField = allowedSort.includes(sort) ? sort : 'created_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  const countResult = await query(`SELECT COUNT(*) FROM events e WHERE ${where}`, values);
  const total = parseInt(countResult.rows[0].count, 10);

  values.push(limit, offset);
  const dataResult = await query(
    `SELECT e.*, o.name AS org_name, o.logo_url AS org_logo
     FROM events e
     JOIN organizations o ON o.id = e.org_id
     WHERE ${where}
     ORDER BY e.${sortField} ${sortOrder}
     LIMIT $${idx++} OFFSET $${idx++}`,
    values
  );

  return { events: dataResult.rows, total };
}

async function getById(id, userId = null) {
  const result = await query(
    `SELECT e.*,
       o.name AS org_name, o.logo_url AS org_logo,
       ${userId
    ? `(SELECT interaction_type FROM interactions
         WHERE user_id = $2 AND item_type = 'event' AND item_id = e.id
           AND interaction_type = 'like' LIMIT 1) IS NOT NULL AS is_liked,
       (SELECT interaction_type FROM interactions
         WHERE user_id = $2 AND item_type = 'event' AND item_id = e.id
           AND interaction_type = 'save' LIMIT 1) IS NOT NULL AS is_saved,
       (SELECT interaction_type FROM interactions
         WHERE user_id = $2 AND item_type = 'event' AND item_id = e.id
           AND interaction_type = 'register' LIMIT 1) IS NOT NULL AS is_registered`
    : 'false AS is_liked, false AS is_saved, false AS is_registered'
  }
     FROM events e
     JOIN organizations o ON o.id = e.org_id
     WHERE e.id = $1`,
    userId ? [id, userId] : [id]
  );

  if (result.rows.length === 0) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }
  return result.rows[0];
}

async function update(id, data) {
  const allowed = [
    'title', 'description', 'category', 'tags', 'location',
    'is_virtual', 'start_date', 'end_date', 'price', 'capacity', 'image_url', 'status',
  ];

  const fields = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (key in data) {
      fields.push(`${key} = $${idx++}`);
      values.push(data[key] === '' ? null : data[key]);
    }
  }

  if (fields.length === 0) return getById(id);

  values.push(id);
  const result = await query(
    `UPDATE events SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${idx}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }

  const event = result.rows[0];
  _generateAndStoreEmbedding('events', event.id, event).catch(() => {});
  return event;
}

async function remove(id) {
  const result = await query('DELETE FROM events WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }
}

async function verifyOwnership(eventId, orgId) {
  const result = await query(
    'SELECT id FROM events WHERE id = $1 AND org_id = $2',
    [eventId, orgId]
  );
  if (result.rows.length === 0) {
    const err = new Error('Event not found or access denied');
    err.status = 403;
    throw err;
  }
}

async function _generateAndStoreEmbedding(table, id, item) {
  const text = buildEmbeddingText(item);
  const embedding = await generateEmbedding(text);
  if (!embedding) return;

  const formatted = `[${embedding.join(',')}]`;
  await query(
    `UPDATE ${table} SET embedding = $1::vector WHERE id = $2`,
    [formatted, id]
  );
}

module.exports = { create, list, getById, update, remove, verifyOwnership };
