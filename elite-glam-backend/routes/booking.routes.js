const express = require('express');
const router = express.Router();
const {
  getBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  getSellerBookings,
  getAllBookingsDebug
} = require('../controllers/booking.controller');
const { updateBookingStatusByBookingId } = require('../controllers/updateBookingStatusByBookingId');
const { protect } = require('../middleware/auth.middleware');

// Debug route to check authentication
router.get('/debug/auth-check', protect, (req, res) => {
  // This route simply checks if authentication is working
  // and returns the user info from the token
  res.status(200).json({
    message: 'Authentication successful',
    user: {
      id: req.user._id,
      uid: req.user.uid,
      username: req.user.username,
      role: req.user.role
    }
  });
});

// All routes now use the protect middleware for proper authentication
// Get user's bookings
router.get('/', protect, getBookings);

// Get seller's bookings (this must come before /:id route)
router.get('/seller', protect, getSellerBookings);

// Debug route for seeing all bookings - this is temporary for debugging
router.get('/debug/all', protect, getAllBookingsDebug);

// Get booking by ID
router.get('/:id', protect, getBookingById);

// Create new booking
router.post('/', protect, createBooking);

// Update booking status by MongoDB _id (recommended for mobile)
router.put('/:id/status', protect, updateBookingStatus);
// Update booking status by bookingId (fallback/legacy)
router.put('/:bookingId/status', protect, updateBookingStatusByBookingId);
// Update booking status by MongoDB _id (legacy)
router.put('/:id', protect, updateBookingStatus);

module.exports = router; 