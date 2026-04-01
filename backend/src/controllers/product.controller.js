'use strict';

const productService = require('../services/product.service');
const { sendSuccess, sendCreated, sendPaginated, paginationMeta } = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const product = await productService.create(req.params.orgId, req.body);
  sendCreated(res, { product });
});

const listByOrg = asyncHandler(async (req, res) => {
  const { products, total } = await productService.list(req.params.orgId, req.query);
  const pagination = paginationMeta(req.query.page, req.query.limit, total);
  sendPaginated(res, { products }, pagination);
});

const getOne = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id, req.user?.id);
  sendSuccess(res, { product });
});

const update = asyncHandler(async (req, res) => {
  const orgId = req.orgId || req.params.orgId;
  await productService.verifyOwnership(req.params.id, orgId);
  const product = await productService.update(req.params.id, req.body);
  sendSuccess(res, { product });
});

const remove = asyncHandler(async (req, res) => {
  const orgId = req.orgId || req.params.orgId;
  await productService.verifyOwnership(req.params.id, orgId);
  await productService.remove(req.params.id);
  sendSuccess(res, null, 'Product deleted');
});

module.exports = { create, listByOrg, getOne, update, remove };
