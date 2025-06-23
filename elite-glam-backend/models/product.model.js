const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      required: true
    },
    size: {
      type: [String],
      required: true
    },
    image: {
      type: String,
      required: true
    },
    images: {
      type: [String],
      default: []
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    averageRating: {
      type: Number,
      default: 0
    },
    numReviews: {
      type: Number,
      default: 0
    },
    location: {
      type: String,
      required: true
    },
    hasMakeupService: {
      type: Boolean,
      default: false
    },
    makeupPrice: {
      type: Number,
      min: 0
    },
    makeupDescription: {
      type: String
    },
    makeupDuration: {
      type: Number
    }
  },
  {
    timestamps: true
  }
);

productSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

productSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 