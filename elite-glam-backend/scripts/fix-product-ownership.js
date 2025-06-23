// Script to fix product ownership: ensures all products for a given freelancer have the correct userId (MongoDB ObjectId)
// Usage: node scripts/fix-product-ownership.js <FREELANCER_OBJECTID> <EMAIL_OR_USERNAME>

const mongoose = require('mongoose');
const Product = require('../models/product.model');
const User = require('../models/user.model');

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elite-glam';

async function main() {
  const [,, freelancerId, identifier] = process.argv;
  if (!freelancerId || !identifier) {
    console.error('Usage: node scripts/fix-product-ownership.js <FREELANCER_OBJECTID> <EMAIL_OR_USERNAME>');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const user = await User.findOne({ $or: [{ _id: freelancerId }, { email: identifier }, { username: identifier }] });
  if (!user) {
    console.error('Freelancer not found by id/email/username:', freelancerId, identifier);
    process.exit(1);
  }

  const products = await Product.find({});
  let fixedCount = 0;
  for (const product of products) {
    if (product.userId.toString() !== user._id.toString()) {
      console.log(`Fixing product ${product._id}: userId was ${product.userId}, now ${user._id}`);
      product.userId = user._id;
      await product.save();
      fixedCount++;
    }
  }
  console.log(`Ownership fix complete. ${fixedCount} products updated for freelancer ${user.username} (${user._id})`);
  process.exit(0);
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
