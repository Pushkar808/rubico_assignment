'use strict';

const orgService = require('../services/organization.service');
const { sendSuccess, sendCreated, sendPaginated, paginationMeta } = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const org = await orgService.create(req.user.id, req.body);
  sendCreated(res, { organization: org });
});

const listMine = asyncHandler(async (req, res) => {
  const orgs = await orgService.list(req.user.id);
  sendSuccess(res, { organizations: orgs });
});

const getOne = asyncHandler(async (req, res) => {
  const org = await orgService.getById(req.params.orgId, req.user.id);
  sendSuccess(res, { organization: org });
});

const update = asyncHandler(async (req, res) => {
  const org = await orgService.update(req.params.orgId, req.body);
  sendSuccess(res, { organization: org });
});

const remove = asyncHandler(async (req, res) => {
  await orgService.remove(req.params.orgId);
  sendSuccess(res, null, 'Organization deleted');
});

const getMembers = asyncHandler(async (req, res) => {
  const members = await orgService.getMembers(req.params.orgId);
  sendSuccess(res, { members });
});

const addMember = asyncHandler(async (req, res) => {
  const result = await orgService.addMember(req.params.orgId, req.body.email, req.body.role);
  sendCreated(res, result, 'Member added');
});

const removeMember = asyncHandler(async (req, res) => {
  await orgService.removeMember(req.params.orgId, req.params.memberId, req.user.id);
  sendSuccess(res, null, 'Member removed');
});

module.exports = { create, listMine, getOne, update, remove, getMembers, addMember, removeMember };
