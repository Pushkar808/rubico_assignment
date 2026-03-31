'use strict';

const { Pool } = require('pg');
const { env } = require('./env');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool(env.db);

    pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL pool error:', err.message);
    });
  }
  return pool;
}

async function query(text, params) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function transaction(callback) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function testConnection() {
  const result = await query('SELECT NOW() AS now');
  console.log(`✓ Database connected at ${result.rows[0].now}`);
  return result.rows[0].now;
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { query, transaction, testConnection, closePool, getPool };
