'use strict';

const { z } = require('zod');

const register = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

const login = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

const refreshToken = z.object({
  refresh_token: z.string().min(1),
});

module.exports = { register, login, refreshToken };
