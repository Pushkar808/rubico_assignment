'use strict';

const { z } = require('zod');

const PRODUCT_STATUSES = ['active', 'inactive'];
const CATEGORIES = [
  'electronics', 'clothing', 'books', 'home', 'sports',
  'food', 'health', 'art', 'software', 'other',
];

const create = z.object({
  title: z.string().min(3).max(500).trim(),
  description: z.string().max(5000).trim().optional(),
  category: z.enum(CATEGORIES).optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
  price: z.number().min(0).max(999999),
  stock: z.number().int().min(0).optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  status: z.enum(PRODUCT_STATUSES).default('active'),
});

const update = create.partial().omit({ tags: true }).extend({
  tags: z.array(z.string().max(50)).max(10).optional(),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  sort: z.enum(['created_at', 'price', 'likes_count']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

const uuidParam = z.object({ id: z.string().uuid() });
const orgUuidParam = z.object({ orgId: z.string().uuid() });

module.exports = { create, update, listQuery, uuidParam, orgUuidParam, CATEGORIES };
