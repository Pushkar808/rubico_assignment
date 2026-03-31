'use strict';

const searchService = require('../services/search.service');
const { isSemanticSearchEnabled } = require('../utils/embedding.util');
const { sendSuccess } = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler');
const { z } = require('zod');

const searchQuerySchema = z.object({
  q: z.string().min(1).max(500).trim(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  type: z.enum(['event', 'product']).optional(),
});

const search = asyncHandler(async (req, res) => {
  const parsed = searchQuerySchema.parse(req.query);
  const userId = req.user?.id ?? null;

  const result = await searchService.search(parsed.q, {
    page: parsed.page,
    limit: parsed.limit,
    type: parsed.type,
    userId,
  });

  sendSuccess(res, {
    ...result,
    semanticSearchEnabled: isSemanticSearchEnabled(),
  });
});

module.exports = { search };
