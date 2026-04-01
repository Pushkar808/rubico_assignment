'use strict';

const eventService = require('../services/event.service');
const { sendSuccess, sendCreated, sendPaginated, paginationMeta } = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const orgId = req.orgId || req.params.orgId;
  const event = await eventService.create(orgId, req.body);
  sendCreated(res, { event });
});

const listByOrg = asyncHandler(async (req, res) => {
  const orgId = req.orgId || req.params.orgId;
  const { events, total } = await eventService.list(orgId, req.query);
  const pagination = paginationMeta(req.query.page, req.query.limit, total);
  sendPaginated(res, { events }, pagination);
});

const getOne = asyncHandler(async (req, res) => {
  const event = await eventService.getById(req.params.id, req.user?.id);
  sendSuccess(res, { event });
});

const update = asyncHandler(async (req, res) => {
  const orgId = req.orgId || req.params.orgId;
  await eventService.verifyOwnership(req.params.id, orgId);
  const event = await eventService.update(req.params.id, req.body);
  sendSuccess(res, { event });
});

const remove = asyncHandler(async (req, res) => {
  const orgId = req.orgId || req.params.orgId;
  await eventService.verifyOwnership(req.params.id, orgId);
  await eventService.remove(req.params.id);
  sendSuccess(res, null, 'Event deleted');
});

module.exports = { create, listByOrg, getOne, update, remove };
