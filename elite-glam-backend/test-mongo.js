const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Define a simple user schema for testing
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Create model
const TestUser = mongoose.model('TestUser', userSchema);

// Function to test MongoDB connection and operations
async function testMongoDB() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    
    // Create a test user
    const testUsername = `test_user_${Date.now()}`;
    const testEmail = `test_${Date.now()}@example.com`;
    
    console.log(`Creating test user: ${testUsername} (${testEmail})`);
    
    const newUser = new TestUser({
      username: testUsername,
      email: testEmail,
      password: 'password123',
      role: 'user'
    });
    
    // Save the user
    const savedUser = await newUser.save();
    console.log('✅ Test user created successfully:', {
      id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      role: savedUser.role
    });
    
    // Delete the test user
    await TestUser.deleteOne({ _id: savedUser._id });
    console.log('✅ Test user deleted successfully');
    
    // Check database statistics
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nDatabase collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\n✅ MongoDB test completed successfully!');
    
  } catch (error) {
    console.error('❌ MongoDB test failed:', error.message);
    if (error.name === 'MongoServerError') {
      if (error.code === 11000) {
        console.log('\nDuplicate key error - the test user might already exist.');
        console.log('This is not necessarily a problem with your MongoDB setup.');
      }
    }
    
    // Try to close the connection if it's open
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

// Run the test
testMongoDB();
