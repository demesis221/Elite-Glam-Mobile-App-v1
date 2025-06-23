const mongoose = require('mongoose');
require('dotenv').config();
const https = require('https');

// Function to get public IP address
const getPublicIP = () => {
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org', (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      console.error('Error getting public IP:', err.message);
      reject(err);
    });
  });
};

// Main function
const checkMongoDBConnection = async () => {
  try {
    console.log('Checking MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    // Get public IP
    const publicIP = await getPublicIP();
    console.log('Your public IP address:', publicIP);
    
    // Try to connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    console.log('Your IP address is properly whitelisted.');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\nPossible issues:');
      console.log('1. MongoDB server is not running');
      console.log('2. MongoDB URI is incorrect');
    } else if (error.message.includes('connection timed out') || 
               error.message.includes('not authorized') ||
               error.message.includes('IP address not allowed')) {
      console.log('\n🔒 IP Whitelist Issue Detected!');
      console.log('\nTo whitelist your IP in MongoDB Atlas:');
      console.log('1. Log in to MongoDB Atlas (https://cloud.mongodb.com)');
      console.log('2. Select your cluster');
      console.log('3. Click on "Network Access" in the left sidebar');
      console.log('4. Click "Add IP Address"');
      console.log(`5. Enter your IP: ${publicIP}`);
      console.log('6. Click "Confirm"');
      console.log('\nAlternatively, you can temporarily allow access from anywhere:');
      console.log('1. Click "Add IP Address"');
      console.log('2. Click "Allow Access from Anywhere"');
      console.log('3. Click "Confirm"');
      console.log('\n⚠️ Note: Allowing access from anywhere is not recommended for production environments');
    }
    
    process.exit(1);
  }
};

// Run the function
checkMongoDBConnection(); 