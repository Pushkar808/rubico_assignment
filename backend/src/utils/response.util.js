'use strict';

function sendSuccess(res, data = null, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function sendCreated(res, data, message = 'Created successfully') {
  return sendSuccess(res, data, message, 201);
}

function sendPaginated(res, data, pagination, message = 'Success') {
  return res.status(200).json({ success: true, message, data, pagination });
}

function sendError(res, message = 'An error occurred', status = 500, errors = null) {
  return res.status(status).json({ success: false, message, ...(errors && { errors }) });
}

function sendNotFound(res, message = 'Resource not found') {
  return sendError(res, message, 404);
}

function sendUnauthorized(res, message = 'Unauthorized') {
  return sendError(res, message, 401);
}

function sendForbidden(res, message = 'Forbidden') {
  return sendError(res, message, 403);
}

function sendBadRequest(res, message = 'Bad request', errors = null) {
  return sendError(res, message, 400, errors);
}

function sendConflict(res, message = 'Conflict') {
  return sendError(res, message, 409);
}

function paginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

module.exports = {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendBadRequest,
  sendConflict,
  paginationMeta,
};
