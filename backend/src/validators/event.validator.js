'use strict';

const { z } = require('zod');

const EVENT_STATUSES = ['draft', 'published', 'cancelled'];
const CATEGORIES = [
  'technology', 'business', 'arts', 'music', 'sports', 'food',
  'health', 'education', 'networking', 'other',
];

const create = z.object({
  title: z.string().min(3).max(500).trim(),
  description: z.string().max(5000).trim().optional(),
  category: z.enum(CATEGORIES).optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
  location: z.string().max(500).trim().optional(),
  is_virtual: z.boolean().default(false),
  start_date: z.string().datetime({ offset: true }).optional(),
  end_date: z.string().datetime({ offset: true }).optional(),
  price: z.number().min(0).max(999999).default(0),
  capacity: z.number().int().min(1).optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  status: z.enum(EVENT_STATUSES).default('published'),
});

const update = create.partial().omit({ tags: true }).extend({
  tags: z.array(z.string().max(50)).max(10).optional(),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(EVENT_STATUSES).optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(['created_at', 'start_date', 'likes_count']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

const uuidParam = z.object({ id: z.string().uuid() });
const orgUuidParam = z.object({ orgId: z.string().uuid() });

module.exports = { create, update, listQuery, uuidParam, orgUuidParam, CATEGORIES };
