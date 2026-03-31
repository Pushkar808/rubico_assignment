'use strict';

const router = require('express').Router();

router.use('/auth',          require('./auth.routes'));
router.use('/organizations', require('./organization.routes'));
router.use('/feed',          require('./feed.routes'));
router.use('/search',        require('./search.routes'));
router.use('/interactions',  require('./interaction.routes'));

// Org-scoped event & product routes
router.use('/organizations/:orgId/events',   require('./event.routes'));
router.use('/organizations/:orgId/products', require('./product.routes'));

// Standalone event/product GET by id
router.use('/events',   require('./event.routes'));
router.use('/products', require('./product.routes'));

module.exports = router;
