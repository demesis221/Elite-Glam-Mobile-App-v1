const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      // This will be generated programmatically, so it's not required in the input
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    serviceName: {
      type: String,
      required: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    date: {
      type: String,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'rejected', 'cancelled'],
      default: 'pending'
    },
    price: {
      type: Number,
      required: true
    },
    notes: {
      type: String,
      default: ''
    },
    uid: {
      type: String,
      required: true
    },
    ownerUid: {
      type: String,
      required: true
    },
    ownerUsername: {
      type: String,
      required: true
    },
    sellerLocation: {
      type: String,
      default: ''
    },
    productImage: {
      type: String,
      default: ''
    },
    eventTimePeriod: {
      type: String,
      enum: ['AM', 'PM'],
      default: 'PM'
    },
    eventType: {
      type: String,
      default: ''
    },
    fittingTime: {
      type: String,
      default: ''
    },
    fittingTimePeriod: {
      type: String,
      enum: ['AM', 'PM'],
      default: 'AM'
    },
    eventLocation: {
      type: String,
      default: ''
    },
    includeMakeupService: {
      type: Boolean,
      default: false
    },
    makeupPrice: {
      type: Number,
      default: 0
    },
    makeupDuration: {
      type: Number, // Duration in minutes
      default: 0
    }
  },
  {
    timestamps: true
  }
);

bookingSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

bookingSchema.set('toJSON', {
  virtuals: true,
  versionKey: false
  // Do not delete _id, so both _id and id are present in the response
});

// Unique index: Only one pending booking per productId, uid, date
bookingSchema.index(
  { productId: 1, uid: 1, date: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking; 