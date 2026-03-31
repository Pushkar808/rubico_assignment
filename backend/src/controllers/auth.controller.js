'use strict';

const authService = require('../services/auth.service');
const { sendSuccess, sendCreated } = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  sendCreated(res, result, 'Registration successful');
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  sendSuccess(res, result, 'Login successful');
});

const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshTokens(req.body.refresh_token);
  sendSuccess(res, result, 'Token refreshed');
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refresh_token);
  sendSuccess(res, null, 'Logged out');
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  sendSuccess(res, { user });
});

module.exports = { register, login, refreshToken, logout, getProfile };
