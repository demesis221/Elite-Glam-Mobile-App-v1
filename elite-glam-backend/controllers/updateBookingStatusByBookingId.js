
// Update a booking status by bookingId
// PUT /bookings/:bookingId/status
const Booking = require('../models/booking.model');

exports.updateBookingStatusByBookingId = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const userIds = [
      req.user.uid,
      req.user.id,
      req.user._id ? req.user._id.toString() : undefined
    ].filter(Boolean);

    if (!status || !['pending', 'confirmed', 'completed', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only owner can update to confirmed/rejected, both can update to cancelled
    if ((status === 'confirmed' || status === 'rejected') && !userIds.includes(booking.ownerUid)) {
      return res.status(403).json({ message: 'Only the owner can confirm or reject bookings' });
    }

    if (status === 'cancelled' && !userIds.includes(booking.uid) && !userIds.includes(booking.ownerUid)) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to update booking status',
      error: error.message
    });
  }
};
