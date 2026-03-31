'use strict';

const { query } = require('../config/database');
const { generateEmbedding, buildEmbeddingText } = require('../utils/embedding.util');

async function create(orgId, data) {
  const { title, description, category, tags, price, stock, image_url, status } = data;

  const result = await query(
    `INSERT INTO products
       (org_id, title, description, category, tags, price, stock, image_url, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      orgId, title, description || null, category || null,
      tags, price, stock ?? null, image_url || null, status,
    ]
  );

  const product = result.rows[0];
  _generateAndStoreEmbedding(product.id, product).catch(() => {});
  return product;
}

async function list(orgId, { page, limit, category, status, min_price, max_price, sort, order }) {
  const offset = (page - 1) * limit;
  const conditions = ['p.org_id = $1'];
  const values = [orgId];
  let idx = 2;

  if (status) { conditions.push(`p.status = $${idx++}`); values.push(status); }
  if (category) { conditions.push(`p.category = $${idx++}`); values.push(category); }
  if (min_price !== undefined) { conditions.push(`p.price >= $${idx++}`); values.push(min_price); }
  if (max_price !== undefined) { conditions.push(`p.price <= $${idx++}`); values.push(max_price); }

  const where = conditions.join(' AND ');
  const allowedSort = ['created_at', 'price', 'likes_count', 'updated_at'];
  const sortField = allowedSort.includes(sort) ? sort : 'created_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  const countResult = await query(`SELECT COUNT(*) FROM products p WHERE ${where}`, values);
  const total = parseInt(countResult.rows[0].count, 10);

  values.push(limit, offset);
  const dataResult = await query(
    `SELECT p.*, o.name AS org_name, o.logo_url AS org_logo
     FROM products p
     JOIN organizations o ON o.id = p.org_id
     WHERE ${where}
     ORDER BY p.${sortField} ${sortOrder}
     LIMIT $${idx++} OFFSET $${idx++}`,
    values
  );

  return { products: dataResult.rows, total };
}

async function getById(id, userId = null) {
  const result = await query(
    `SELECT p.*,
       o.name AS org_name, o.logo_url AS org_logo,
       ${userId
    ? `(SELECT 1 FROM interactions
         WHERE user_id = $2 AND item_type = 'product' AND item_id = p.id
           AND interaction_type = 'like') IS NOT NULL AS is_liked,
       (SELECT 1 FROM interactions
         WHERE user_id = $2 AND item_type = 'product' AND item_id = p.id
           AND interaction_type = 'save') IS NOT NULL AS is_saved`
    : 'false AS is_liked, false AS is_saved'
  }
     FROM products p
     JOIN organizations o ON o.id = p.org_id
     WHERE p.id = $1`,
    userId ? [id, userId] : [id]
  );

  if (result.rows.length === 0) {
    const err = new Error('Product not found');
    err.status = 404;
    throw err;
  }
  return result.rows[0];
}

async function update(id, data) {
  const allowed = [
    'title', 'description', 'category', 'tags',
    'price', 'stock', 'image_url', 'status',
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
    `UPDATE products SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${idx}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    const err = new Error('Product not found');
    err.status = 404;
    throw err;
  }

  const product = result.rows[0];
  _generateAndStoreEmbedding(product.id, product).catch(() => {});
  return product;
}

async function remove(id) {
  const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) {
    const err = new Error('Product not found');
    err.status = 404;
    throw err;
  }
}

async function verifyOwnership(productId, orgId) {
  const result = await query(
    'SELECT id FROM products WHERE id = $1 AND org_id = $2',
    [productId, orgId]
  );
  if (result.rows.length === 0) {
    const err = new Error('Product not found or access denied');
    err.status = 403;
    throw err;
  }
}

async function _generateAndStoreEmbedding(id, item) {
  const text = buildEmbeddingText(item);
  const embedding = await generateEmbedding(text);
  if (!embedding) return;
  const formatted = `[${embedding.join(',')}]`;
  await query(`UPDATE products SET embedding = $1::vector WHERE id = $2`, [formatted, id]);
}

module.exports = { create, list, getById, update, remove, verifyOwnership };
