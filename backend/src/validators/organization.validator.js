'use strict';

const { z } = require('zod');

const create = z.object({
  name: z.string().min(2).max(255).trim(),
  description: z.string().max(2000).trim().optional(),
  website: z.string().url().optional().or(z.literal('')),
  logo_url: z.string().url().optional().or(z.literal('')),
});

const update = create.partial();

const uuidParam = z.object({
  orgId: z.string().uuid(),
});

const addMember = z.object({
  email: z.string().email().toLowerCase().trim(),
  role: z.enum(['admin', 'member']).default('member'),
});

module.exports = { create, update, uuidParam, addMember };
