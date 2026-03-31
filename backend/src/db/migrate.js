'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { query, testConnection, closePool } = require('../config/database');

async function migrate() {
  try {
    await testConnection();

    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf-8');

    // Split by semicolons but preserve function bodies ($$...$$)
    // Execute the whole schema as one batch — PostgreSQL handles it
    await query(sql);
    console.log('✓ Schema migration completed successfully');
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

migrate();
