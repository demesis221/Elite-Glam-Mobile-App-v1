const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, getUserById } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

// Public route to get user by ID
router.get('/user/:id', getUserById);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router; 