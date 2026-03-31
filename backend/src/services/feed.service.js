'use strict';

const { query } = require('../config/database');
const { getUserInteractions } = require('./interaction.service');

/**
 * Returns a mixed (events + products) feed with pagination.
 * Cursor-based pagination for scalability; falls back to offset for simplicity.
 */
async function getFeed(userId, { page = 1, limit = 20, type, category, sort = 'created_at', order = 'desc' } = {}) {
  const offset = (page - 1) * limit;
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  // Build event query
  const eventConditions = ["e.status = 'published'"];
  const eventValues = [];
  let eidx = 1;

  if (category) { eventConditions.push(`e.category = $${eidx++}`); eventValues.push(category); }

  // Build product query
  const productConditions = ["p.status = 'active'"];
  const productValues = [];
  let pidx = 1;

  if (category) { productConditions.push(`p.category = $${pidx++}`); productValues.push(category); }

  const eventWhere = eventConditions.join(' AND ');
  const productWhere = productConditions.join(' AND ');

  // Determine sort column (unified names)
  const sortCol = ['created_at', 'likes_count', 'saves_count'].includes(sort) ? sort : 'created_at';

  let rows = [];
  let total = 0;

  if (!type || type === 'event') {
    const eventCountRes = await query(
      `SELECT COUNT(*) FROM events e WHERE ${eventWhere}`,
      eventValues
    );
    total += parseInt(eventCountRes.rows[0].count, 10);
  }

  if (!type || type === 'product') {
    const productCountRes = await query(
      `SELECT COUNT(*) FROM products p WHERE ${productWhere}`,
      productValues
    );
    total += parseInt(productCountRes.rows[0].count, 10);
  }

  // UNION query for mixed feed
  const unionParts = [];
  const unionValues = [];
  let uIdx = 1;

  if (!type || type === 'event') {
    const ev = eventValues.map((_, i) => `$${uIdx + i}`);
    unionValues.push(...eventValues);
    uIdx += eventValues.length;
    const evWhere = eventConditions
      .map((c, i) => (eventValues[i] !== undefined ? c.replace(`$${i + 1}`, ev[i]) : c))
      .join(' AND ');

    unionParts.push(`
      SELECT
        e.id, 'event' AS item_type, e.title, e.description, e.category,
        e.tags, e.image_url, e.likes_count, e.saves_count,
        e.price, e.status, e.created_at, e.updated_at,
        e.start_date, e.end_date, e.location, e.is_virtual,
        e.registered_count, NULL::numeric AS stock,
        o.id AS org_id, o.name AS org_name, o.logo_url AS org_logo
      FROM events e
      JOIN organizations o ON o.id = e.org_id
      WHERE ${evWhere}
    `);
  }

  if (!type || type === 'product') {
    const pv = productValues.map((_, i) => `$${uIdx + i}`);
    unionValues.push(...productValues);
    uIdx += productValues.length;
    const pvWhere = productConditions
      .map((c, i) => (productValues[i] !== undefined ? c.replace(`$${i + 1}`, pv[i]) : c))
      .join(' AND ');

    unionParts.push(`
      SELECT
        p.id, 'product' AS item_type, p.title, p.description, p.category,
        p.tags, p.image_url, p.likes_count, p.saves_count,
        p.price, p.status, p.created_at, p.updated_at,
        NULL::timestamptz AS start_date, NULL::timestamptz AS end_date,
        NULL AS location, false AS is_virtual,
        NULL::integer AS registered_count, p.stock,
        o.id AS org_id, o.name AS org_name, o.logo_url AS org_logo
      FROM products p
      JOIN organizations o ON o.id = p.org_id
      WHERE ${pvWhere}
    `);
  }

  if (unionParts.length === 0) {
    return { items: [], total: 0, page, limit };
  }

  unionValues.push(limit, offset);
  const limitIdx = uIdx;
  const offsetIdx = uIdx + 1;

  const sql = `
    SELECT * FROM (${unionParts.join(' UNION ALL ')}) AS feed
    ORDER BY ${sortCol} ${sortOrder}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const result = await query(sql, unionValues);
  rows = result.rows;

  // Attach user interactions if authenticated
  if (userId && rows.length > 0) {
    const eventIds = rows.filter((r) => r.item_type === 'event').map((r) => r.id);
    const productIds = rows.filter((r) => r.item_type === 'product').map((r) => r.id);

    const [eventInteractions, productInteractions] = await Promise.all([
      eventIds.length > 0 ? getUserInteractions(userId, eventIds, 'event') : {},
      productIds.length > 0 ? getUserInteractions(userId, productIds, 'product') : {},
    ]);

    rows = rows.map((row) => {
      const interactions = row.item_type === 'event'
        ? eventInteractions[row.id]
        : productInteractions[row.id];
      return {
        ...row,
        is_liked: Boolean(interactions?.like),
        is_saved: Boolean(interactions?.save),
        is_registered: Boolean(interactions?.register),
      };
    });
  }

  return { items: rows, total, page, limit };
}

module.exports = { getFeed };
