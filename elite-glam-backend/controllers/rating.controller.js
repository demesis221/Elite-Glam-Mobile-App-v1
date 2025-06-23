const Rating = require('../models/rating.model');
const Product = require('../models/product.model');
const asyncHandler = require('express-async-handler');

// @desc    Create a new rating
// @route   POST /api/ratings
// @access  Private
const createRating = asyncHandler(async (req, res) => {
  const { productId, rating, comment } = req.body;
  const { _id: userId, username } = req.user;

  if (!productId || !rating || !comment) {
    res.status(400);
    throw new Error('Please provide productId, rating, and comment');
  }

  const product = await Product.findById(productId);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const alreadyRated = await Rating.findOne({ productId, userId });

  if (alreadyRated) {
    res.status(400);
    throw new Error('You have already rated this product');
  }

  const newRating = await Rating.create({
    productId,
    userId,
    username,
    rating,
    comment,
  });

  if (newRating) {
    // Update product's average rating and number of reviews
    const ratings = await Rating.find({ productId });
    product.numReviews = ratings.length;
    product.averageRating =
      ratings.reduce((acc, item) => item.rating + acc, 0) / ratings.length;

    await product.save();
    res.status(201).json(newRating);
  } else {
    res.status(400);
    throw new Error('Invalid rating data');
  }
});

// @desc    Get ratings for a product
// @route   GET /api/ratings/:productId
// @access  Public
const getProductRatings = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const ratings = await Rating.find({ productId }).sort({ createdAt: -1 });
  res.json(ratings);
});

module.exports = {
  createRating,
  getProductRatings,
};
