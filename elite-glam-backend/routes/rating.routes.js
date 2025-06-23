const express = require('express');
const router = express.Router();
const {
  createRating,
  getProductRatings,
} = require('../controllers/rating.controller');
const { protect } = require('../middleware/auth.middleware');

router.route('/').post(protect, createRating);
router.route('/:productId').get(getProductRatings);

module.exports = router;
