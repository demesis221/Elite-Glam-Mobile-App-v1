const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductsByUser
} = require('../controllers/product.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/user/:userId', getProductsByUser);
router.get('/:id', getProductById);

// Protected routes
router.post('/', protect, createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router; 