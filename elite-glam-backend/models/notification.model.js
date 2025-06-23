const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // e.g., booking_confirmed, new_booking, etc.
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: Object }, // for deep linking (e.g., bookingId)
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
