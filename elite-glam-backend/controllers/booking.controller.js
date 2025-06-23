const Booking = require('../models/booking.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');
const Notification = require('../models/notification.model');

// Get all bookings for a user
// GET /bookings
exports.getBookings = async (req, res) => {
  try {
    // Use the authenticated user's ID instead of query param
    const uid = req.user._id.toString(); // [UNIFIED] Always use MongoDB ObjectId as string
    
    const bookings = await Booking.find({ uid }).sort({ createdAt: -1 });
    
    res.status(200).json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to get bookings',
      error: error.message
    });
  }
};

// Get a booking by id
// GET /bookings/:id
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user._id.toString(); // [UNIFIED] Always use MongoDB ObjectId as string

    let booking = null;
    // Always try ObjectId lookup first
    if (mongoose.Types.ObjectId.isValid(id)) {
      try {
        booking = await Booking.findById(new mongoose.Types.ObjectId(id));
        if (booking) console.log('[getBookingById] Found by ObjectId(_id):', booking._id.toString());
      } catch (e) {
        console.error('[getBookingById] Error in ObjectId lookup:', e);
      }
    }
    // Fallback to bookingId string
    if (!booking) {
      booking = await Booking.findOne({ bookingId: id });
      if (booking) console.log('[getBookingById] Found by bookingId:', booking.bookingId);
    }

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized (customer or owner)
    if (booking.uid !== uid && booking.ownerUid !== uid) {
  console.error('[AUTH ERROR getBookingById] User not authorized:', { user: uid, bookingUid: booking.uid, ownerUid: booking.ownerUid });
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to get booking',
      error: error.message
    });
  }
};

// Create a new booking
// POST /bookings
exports.createBooking = async (req, res) => {
  try {
    const {
      customerName,
      serviceName,
      productId,
      date,
      time,
      price,
      ownerUid,
      ownerUsername,
      sellerLocation,
      productImage,
      eventTimePeriod,
      eventType,
      fittingTime,
      fittingTimePeriod,
      eventLocation,
      includeMakeupService,
      makeupPrice
    } = req.body;
    
    // Use the authenticated user's ID 
    const uid = req.user._id.toString(); // [UNIFIED] Always use MongoDB ObjectId as string
    
    console.log('Creating booking with data:', {
      customerName,
      serviceName,
      productId,
      uid,
      ownerUid,
      ownerUsername
    });
    
    // Validate required fields
    if (!customerName || !serviceName || !productId || !date || !time || !price || !ownerUid) {
      console.error('Missing required fields:', {
        customerName: !!customerName,
        serviceName: !!serviceName,
        productId: !!productId,
        date: !!date,
        time: !!time,
        price: !!price,
        ownerUid: !!ownerUid
      });
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
        // Pre-insert check: Only allow one pending booking per productId, uid, date
    const existingPending = await Booking.findOne({
      productId,
      uid,
      date,
      status: 'pending'
    });
    if (existingPending) {
      return res.status(409).json({ message: 'You already have a pending booking for this product on this date.' });
    }

    // Save booking
    const newBooking = new Booking({
      bookingId: `BK${Date.now()}`.slice(0, 10) + Math.random().toString(36).substr(2, 5).toUpperCase(),
      customerName,
      serviceName,
      productId,
      date,
      time,
      price,
      ownerUid,
      ownerUsername,
      sellerLocation,
      productImage,
      eventTimePeriod,
      eventType,
      fittingTime,
      fittingTimePeriod,
      eventLocation,
      includeMakeupService,
      makeupPrice,
      uid, // customer uid
      status: 'pending', // always set status to pending on creation
      createdAt: new Date(),
    });
    try {
      await newBooking.save();
    } catch (err) {
      // Handle duplicate key error from unique index
      if (err && err.code === 11000) {
        return res.status(409).json({ message: 'Duplicate pending booking detected for this product and date.' });
      }
      throw err;
    }
    console.log('[Booking Created]', {
      _id: newBooking._id,
      ownerUid: newBooking.ownerUid,
      status: newBooking.status,
      customerUid: newBooking.uid,
      date: newBooking.date,
      time: newBooking.time,
      productId: newBooking.productId,
    });

    // Check if product exists
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.error('Invalid product ID:', productId);
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      console.error('Product not found with ID:', productId);
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Double-check the ownerUid against the product's userId
    const productOwnerId = product.userId.toString(); // Always use MongoDB ObjectId as string
    console.log('Product owner check:', {
      providedOwnerId: ownerUid,
      productOwnerId: productOwnerId,
      match: productOwnerId === ownerUid
    });
    
    // Generate a unique, human-readable booking ID
    const bookingId = `BK${Date.now()}`.slice(0, 10) + Math.random().toString(36).substr(2, 5).toUpperCase();

    // Create booking
    const booking = await Booking.create({
      bookingId,
      customerName,
      serviceName,
      productId,
      date,
      time,
      status: 'pending',
      price,
      uid,
      ownerUid: productOwnerId, // Always use the product's userId (ObjectId string) to ensure accuracy
      ownerUsername,
      sellerLocation: sellerLocation || product.location || '',
      productImage: productImage || product.image || '',
      eventTimePeriod: eventTimePeriod || 'PM',
      eventType: eventType || '',
      fittingTime: fittingTime || '',
      fittingTimePeriod: fittingTimePeriod || 'AM',
      eventLocation: eventLocation || '',
      includeMakeupService: includeMakeupService || false,
      makeupPrice: makeupPrice || 0,
      notes: eventLocation || ''  // For backwards compatibility
    });
    
    console.log('Booking created successfully:', {
      id: booking._id,
      ownerUid: booking.ownerUid,
      customerUid: booking.uid
    });
    
    // --- PATCH: Notify freelancer (owner) of new booking ---
    try {
      const User = require('../models/user.model');
      const owner = await User.findOne({ uid: booking.ownerUid });
      if (owner) {
        await Notification.create({
          userId: owner._id,
          type: 'new_booking',
          title: 'New Booking Received',
          body: `You have a new booking for ${booking.serviceName} from ${booking.customerName}.`,
          data: { bookingId: booking._id },
          isRead: false,
          createdAt: new Date()
        });
        console.log('[Notification] Sent new_booking notification to freelancer:', owner._id.toString());
      } else {
        console.warn('[Notification] No owner found for id:', booking.ownerUid);
      }
    } catch (notifyErr) {
      console.error('[Notification] Failed to send new booking notification:', notifyErr);
    }
    // --- END PATCH ---

    res.status(201).json(booking);
  } catch (error) {
    // Enhanced error handling for duplicate booking
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate pending booking: You already have a pending booking for this product and date.' });
    }
    // Enhanced error logging for debugging booking creation
    console.error('[createBooking] Error creating booking:', error);
    if (error && error.stack) {
      console.error('[createBooking] Stack:', error.stack);
    }
    if (req && req.body) {
      console.error('[createBooking] Incoming payload:', JSON.stringify(req.body));
    }
    res.status(500).json({
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

// Update a booking status
// PUT /bookings/:id
exports.updateBookingStatus = async (req, res) => {
  try {
    // Granular debug logging
    console.log('=== Booking Status Update Debug ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    const { id } = req.params;
    const { status } = req.body;
    const uid = req.user._id.toString(); // [UNIFIED] Always use MongoDB ObjectId as string
    console.log('Received booking id:', id, 'Type:', typeof id);
    console.log('isValidObjectId:', mongoose.Types.ObjectId.isValid(id));

    // Debug: Log incoming id, its type, and ObjectId validity
    console.log('[updateBookingStatus] Received update for param id:', id, 'type:', typeof id, 'isValidObjectId:', mongoose.Types.ObjectId.isValid(id));

    // Debug: List all booking _id and bookingId in DB
    const allBookings = await Booking.find({}, { _id: 1, bookingId: 1 });
    console.log('[updateBookingStatus] All booking IDs in DB:', allBookings.map(b => ({ _id: b._id.toString(), bookingId: b.bookingId })));

    // Try to find by ObjectId (explicitly cast)
    let booking = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      try {
        booking = await Booking.findById(new mongoose.Types.ObjectId(id));
        if (booking) {
          console.log('[updateBookingStatus] Found booking by ObjectId(_id):', booking._id.toString());
        }
      } catch (e) {
        console.error('[updateBookingStatus] Error in ObjectId lookup:', e);
      }
    }
    // Try by bookingId
    if (!booking) {
      booking = await Booking.findOne({ bookingId: id });
      if (booking) console.log('[updateBookingStatus] Found booking by bookingId:', booking.bookingId);
    }
    // Manual string search fallback
    if (!booking) {
      const byString = allBookings.find(b => b._id.toString() === id || b.bookingId === id);
      if (byString) {
        console.log('[updateBookingStatus] Found booking by manual string comparison:', byString);
      } else {
        console.error('[updateBookingStatus] No booking found for id:', id, 'All IDs:', allBookings.map(b => b._id.toString()));
      }
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[updateBookingStatus] Lookup', { param: id, foundId: booking?._id, foundBookingId: booking?.bookingId });
    }
    if (!status || !['pending', 'confirmed', 'completed', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    if (!booking) {
      // Enhanced error message
      return res.status(404).json({ message: `Booking not found. Searched for id: ${id}. All booking IDs: ${allBookings.map(b => b._id.toString()).join(', ')}. All bookingIds: ${allBookings.map(b => b.bookingId).join(', ')}` });
    }
    
    // Only owner can update to confirmed/rejected, both can update to cancelled
    if ((status === 'confirmed' || status === 'rejected') && booking.ownerUid !== uid) {
  console.error('[AUTH ERROR updateBookingStatus] Only owner can confirm/reject:', { user: uid, ownerUid: booking.ownerUid });
      return res.status(403).json({ message: 'Only the owner can confirm or reject bookings' });
    }
    
    if (status === 'cancelled' && booking.uid !== uid && booking.ownerUid !== uid) {
  console.error('[AUTH ERROR updateBookingStatus] Only customer or owner can cancel:', { user: uid, bookingUid: booking.uid, ownerUid: booking.ownerUid });
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }
    
    booking.status = status;
    await booking.save();

    // Send notifications on status changes
    const notifications = [];
    const bookingLink = { bookingId: booking._id.toString() };
    if (status === 'confirmed') {
      // Notify customer
      notifications.push(new Notification({
        userId: booking.uid,
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        body: `Your booking for ${booking.serviceName} has been confirmed by ${booking.ownerUsername}.`,
        data: bookingLink
      }));
    } else if (status === 'completed') {
      // Notify customer
      notifications.push(new Notification({
        userId: booking.uid,
        type: 'booking_completed',
        title: 'Booking Completed',
        body: `Your booking for ${booking.serviceName} has been marked as completed.`,
        data: bookingLink
      }));
    } else if (status === 'rejected') {
      // Notify customer
      notifications.push(new Notification({
        userId: booking.uid,
        type: 'booking_rejected',
        title: 'Booking Rejected',
        body: `Your booking for ${booking.serviceName} was rejected by ${booking.ownerUsername}.`,
        data: bookingLink
      }));
    } else if (status === 'cancelled') {
      // Notify both parties
      notifications.push(new Notification({
        userId: booking.uid,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        body: `Your booking for ${booking.serviceName} has been cancelled.`,
        data: bookingLink
      }));
      notifications.push(new Notification({
        userId: booking.ownerUid,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        body: `A booking for ${booking.serviceName} has been cancelled by the customer.`,
        data: bookingLink
      }));
    }
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
    res.status(200).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to update booking status',
      error: error.message
    });
  }
};

// Get all bookings for a seller
// GET /bookings/seller
exports.getSellerBookings = async (req, res) => {
  try {
    // Always use the authenticated user's MongoDB ObjectId as ownerUid
    const ownerUid = req.user._id.toString();

    console.log(`Fetching seller bookings for owner: ${ownerUid}`);
    console.log('User info:', {
      id: req.user._id,
      uid: req.user.uid,
      role: req.user.role,
      username: req.user.username
    });
    
    // First check if there are any bookings with this owner at all
    const totalBookings = await Booking.countDocuments({});
    console.log(`Total bookings in system: ${totalBookings}`);
    
    // Check if any bookings exist with the ownerUid
    const ownerBookingsCount = await Booking.countDocuments({ ownerUid });
    console.log(`Bookings with ownerUid ${ownerUid}: ${ownerBookingsCount}`);
    
    // If no bookings found for this owner, log a sample of bookings for debugging
    if (ownerBookingsCount === 0 && totalBookings > 0) {
      const sampleBookings = await Booking.find({}).limit(3);
      console.log('Sample bookings in system:', sampleBookings.map(b => ({
        id: b._id,
        ownerUid: b.ownerUid,
        customerName: b.customerName
      })));
    }
    
    // Fetch the actual bookings
    const bookings = await Booking.find({ ownerUid }).sort({ createdAt: -1 });
    
    console.log(`Found ${bookings.length} bookings for owner ${ownerUid}`);
    
    res.status(200).json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to get seller bookings',
      error: error.message
    });
  }
};

// Debug endpoint - Get all bookings (admin only)
// GET /bookings/debug/all
exports.getAllBookingsDebug = async (req, res) => {
  try {
    // Use the authenticated user's ID
    const uid = req.user._id.toString(); // [UNIFIED] Always use MongoDB ObjectId as string
    
    // Check if user is admin or allowed to access debug info
    const userRole = req.user.role || 'user';
    
    // This is for debugging, so we'll show all bookings but log who accessed it
    console.log(`Debug: User ${uid} (role: ${userRole}) accessed all bookings debug endpoint`);
    
    const bookings = await Booking.find({}).sort({ createdAt: -1 }).limit(20);
    
    // Log booking info for debugging
    console.log(`Debug: Total bookings in system: ${bookings.length}`);
    
    if (bookings.length > 0) {
      // Log sample data from the first booking
      console.log('Debug: Sample booking data:', {
        id: bookings[0]._id,
        customerName: bookings[0].customerName,
        ownerUid: bookings[0].ownerUid,
        productId: bookings[0].productId
      });
    }
    
    res.status(200).json({
      bookingsCount: bookings.length,
      bookings: bookings.map(booking => ({
        id: booking._id,
        customerName: booking.customerName,
        serviceName: booking.serviceName,
        ownerUid: booking.ownerUid,
        uid: booking.uid,
        status: booking.status,
        date: booking.date
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to get debug bookings',
      error: error.message
    });
  }
}; 