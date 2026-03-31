'use strict';

const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
} = require('../utils/jwt.util');

const SALT_ROUNDS = 12;

async function register({ name, email, password }) {
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, avatar_url, created_at`,
    [name, email, password_hash]
  );

  const user = result.rows[0];
  return _issueTokens(user);
}

async function login({ email, password }) {
  const result = await query(
    `SELECT id, name, email, password_hash, avatar_url FROM users WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    _throwInvalidCredentials();
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) _throwInvalidCredentials();

  const { password_hash, ...userOut } = user;
  return _issueTokens(userOut);
}

async function refreshTokens(rawToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(rawToken);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.status = 401;
    throw err;
  }

  const tokenHash = hashToken(rawToken);
  const stored = await query(
    `SELECT id, user_id, expires_at FROM refresh_tokens
     WHERE token_hash = $1 AND user_id = $2 AND expires_at > NOW()`,
    [tokenHash, decoded.id]
  );

  if (stored.rows.length === 0) {
    const err = new Error('Refresh token revoked or expired');
    err.status = 401;
    throw err;
  }

  const userResult = await query(
    'SELECT id, name, email, avatar_url FROM users WHERE id = $1',
    [decoded.id]
  );

  if (userResult.rows.length === 0) {
    const err = new Error('User not found');
    err.status = 401;
    throw err;
  }

  // Rotate refresh token
  await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);

  return _issueTokens(userResult.rows[0]);
}

async function logout(rawToken) {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
}

async function getProfile(userId) {
  const result = await query(
    `SELECT id, name, email, avatar_url, created_at FROM users WHERE id = $1`,
    [userId]
  );
  if (result.rows.length === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return result.rows[0];
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

async function _issueTokens(user) {
  const payload = { id: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const tokenHash = hashToken(refreshToken);
  const expiresAt = getRefreshTokenExpiry();

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt]
  );

  return { user: { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url }, accessToken, refreshToken };
}

function _throwInvalidCredentials() {
  const err = new Error('Invalid email or password');
  err.status = 401;
  throw err;
}

module.exports = { register, login, refreshTokens, logout, getProfile };
