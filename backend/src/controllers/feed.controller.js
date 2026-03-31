'use strict';

const feedService = require('../services/feed.service');
const { sendPaginated, paginationMeta } = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler');
const { z } = require('zod');

const feedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  type: z.enum(['event', 'product']).optional(),
  category: z.string().optional(),
  sort: z.enum(['created_at', 'likes_count', 'saves_count']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

const getFeed = asyncHandler(async (req, res) => {
  const parsed = feedQuerySchema.parse(req.query);
  const userId = req.user?.id ?? null;

  const { items, total, page, limit } = await feedService.getFeed(userId, parsed);
  const pagination = paginationMeta(page, limit, total);
  sendPaginated(res, { items }, pagination);
});

module.exports = { getFeed };
