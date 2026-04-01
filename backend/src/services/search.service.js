'use strict';

const natural = require('natural');
const { query } = require('../config/database');
const { generateQueryEmbedding, isSemanticSearchEnabled } = require('../utils/embedding.util');
const { getUserInteractions } = require('./interaction.service');

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

/**
 * Preprocesses a natural language query:
 * - Tokenize and remove stopwords
 * - Stem for broader matching
 * Returns an array of processed terms.
 */
function preprocessQuery(text) {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  const stopwords = new Set(natural.stopwords);
  const filtered = tokens.filter((t) => t.length > 2 && !stopwords.has(t));
  return filtered.map((t) => stemmer.stem(t));
}

/**
 * Main search function.
 * - If OpenAI is configured: uses vector (semantic) search + text search hybrid.
 * - Otherwise: uses PostgreSQL full-text search.
 */
async function search(rawQuery, { page = 1, limit = 20, type, userId } = {}) {
  const offset = (page - 1) * limit;

  if (isSemanticSearchEnabled()) {
    return _semanticSearch(rawQuery, { page, limit, offset, type, userId });
  }

  return _textSearch(rawQuery, { page, limit, offset, type, userId });
}

// ─── Full-text search (always available) ──────────────────────────────────────

async function _textSearch(rawQuery, { page, limit, offset, type, userId }) {
  const terms = preprocessQuery(rawQuery);
  const tsQuery = terms.length > 0
    ? terms.join(' | ')
    : rawQuery.trim();

  const eventQuery = `
    SELECT
      e.id, 'event' AS item_type, e.title, e.description, e.category,
      e.tags, e.image_url, e.likes_count, e.saves_count, e.price,
      e.status, e.created_at, e.start_date, e.end_date, e.location,
      e.is_virtual, e.registered_count, NULL::numeric AS stock,
      o.id AS org_id, o.name AS org_name, o.logo_url AS org_logo,
      ts_rank(e.search_vector, to_tsquery('english', $1)) AS rank
    FROM events e
    JOIN organizations o ON o.id = e.org_id
    WHERE e.status = 'published'
      AND e.search_vector @@ to_tsquery('english', $1)
  `;

  const productQuery = `
    SELECT
      p.id, 'product' AS item_type, p.title, p.description, p.category,
      p.tags, p.image_url, p.likes_count, p.saves_count, p.price,
      p.status, p.created_at, NULL::timestamptz AS start_date,
      NULL::timestamptz AS end_date, NULL AS location, false AS is_virtual,
      NULL::integer AS registered_count, p.stock,
      o.id AS org_id, o.name AS org_name, o.logo_url AS org_logo,
      ts_rank(p.search_vector, to_tsquery('english', $1)) AS rank
    FROM products p
    JOIN organizations o ON o.id = p.org_id
    WHERE p.status = 'active'
      AND p.search_vector @@ to_tsquery('english', $1)
  `;

  let unionSql;
  if (type === 'event') {
    unionSql = eventQuery;
  } else if (type === 'product') {
    unionSql = productQuery;
  } else {
    unionSql = `${eventQuery} UNION ALL ${productQuery}`;
  }

  // Fallback: if stemmed query fails, use plain text query
  let rows = [];
  try {
    const result = await query(
      `SELECT * FROM (${unionSql}) AS results ORDER BY rank DESC LIMIT $2 OFFSET $3`,
      [tsQuery, limit, offset]
    );
    rows = result.rows;
  } catch {
    // Fallback to plainto_tsquery which is more forgiving
    const fallbackEvent = eventQuery.replace(/to_tsquery\('english', \$1\)/g, "plainto_tsquery('english', $1)");
    const fallbackProduct = productQuery.replace(/to_tsquery\('english', \$1\)/g, "plainto_tsquery('english', $1)");
    const fallbackUnion = type === 'event'
      ? fallbackEvent
      : type === 'product'
        ? fallbackProduct
        : `${fallbackEvent} UNION ALL ${fallbackProduct}`;

    const fallbackResult = await query(
      `SELECT * FROM (${fallbackUnion}) AS results ORDER BY rank DESC LIMIT $2 OFFSET $3`,
      [rawQuery.trim(), limit, offset]
    );
    rows = fallbackResult.rows;
  }

  rows = await _attachInteractions(rows, userId);

  return {
    items: rows,
    query: rawQuery,
    searchType: 'full_text',
    page,
    limit,
  };
}

// ─── Semantic / vector search (requires OpenAI) ───────────────────────────────

async function _semanticSearch(rawQuery, { page, limit, offset, type, userId }) {
  const embedding = await generateQueryEmbedding(rawQuery);
  if (!embedding) return _textSearch(rawQuery, { page, limit, offset, type, userId });

  const formatted = `[${embedding.join(',')}]`;

  const eventQuery = `
    SELECT
      e.id, 'event' AS item_type, e.title, e.description, e.category,
      e.tags, e.image_url, e.likes_count, e.saves_count, e.price,
      e.status, e.created_at, e.start_date, e.end_date, e.location,
      e.is_virtual, e.registered_count, NULL::numeric AS stock,
      o.id AS org_id, o.name AS org_name, o.logo_url AS org_logo,
      1 - (e.embedding <=> $1::vector) AS rank
    FROM events e
    JOIN organizations o ON o.id = e.org_id
    WHERE e.status = 'published'
      AND e.embedding IS NOT NULL
  `;

  const productQuery = `
    SELECT
      p.id, 'product' AS item_type, p.title, p.description, p.category,
      p.tags, p.image_url, p.likes_count, p.saves_count, p.price,
      p.status, p.created_at, NULL::timestamptz AS start_date,
      NULL::timestamptz AS end_date, NULL AS location, false AS is_virtual,
      NULL::integer AS registered_count, p.stock,
      o.id AS org_id, o.name AS org_name, o.logo_url AS org_logo,
      1 - (p.embedding <=> $1::vector) AS rank
    FROM products p
    JOIN organizations o ON o.id = p.org_id
    WHERE p.status = 'active'
      AND p.embedding IS NOT NULL
  `;

  const unionSql = type === 'event'
    ? eventQuery
    : type === 'product'
      ? productQuery
      : `${eventQuery} UNION ALL ${productQuery}`;

  const result = await query(
    `SELECT * FROM (${unionSql}) AS results WHERE rank > 0.5 ORDER BY rank DESC LIMIT $2 OFFSET $3`,
    [formatted, limit, offset]
  );

  let rows = await _attachInteractions(result.rows, userId);

  return {
    items: rows,
    query: rawQuery,
    searchType: 'semantic',
    page,
    limit,
  };
}

async function _attachInteractions(rows, userId) {
  if (!userId || rows.length === 0) return rows;

  const eventIds = rows.filter((r) => r.item_type === 'event').map((r) => r.id);
  const productIds = rows.filter((r) => r.item_type === 'product').map((r) => r.id);

  const [eventInteractions, productInteractions] = await Promise.all([
    eventIds.length > 0 ? getUserInteractions(userId, eventIds, 'event') : {},
    productIds.length > 0 ? getUserInteractions(userId, productIds, 'product') : {},
  ]);

  return rows.map((row) => {
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

module.exports = { search };
