'use strict';

const interactionService = require('../services/interaction.service');
const { sendSuccess, sendPaginated, paginationMeta } = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler');
const { z } = require('zod');

const toggleSchema = z.object({
  item_type: z.enum(['event', 'product']),
  item_id: z.string().uuid(),
  interaction_type: z.enum(['like', 'save', 'register']),
});

const toggle = asyncHandler(async (req, res) => {
  const { item_type, item_id, interaction_type } = toggleSchema.parse(req.body);
  const result = await interactionService.toggle(
    req.user.id, item_type, item_id, interaction_type
  );
  sendSuccess(res, result);
});

const getSaved = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const { items, total } = await interactionService.getUserSaved(req.user.id, { page, limit });
  const pagination = paginationMeta(page, limit, total);
  sendPaginated(res, { items }, pagination);
});

module.exports = { toggle, getSaved };
