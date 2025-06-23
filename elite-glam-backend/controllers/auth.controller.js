const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Register a new user
// POST /auth/register
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        message: 'User already exists'
      });
    }

    // Check if username is taken
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({
        message: 'Username already taken'
      });
    }

    // Map role from mobile app to database role
    // Mobile app uses 'user' and 'freelancer', database uses 'customer' and 'seller'
    let dbRole = 'customer';
    if (role) {
      if (role === 'freelancer' || role === 'seller') {
        dbRole = 'seller';
      } else if (role === 'user' || role === 'customer') {
        dbRole = 'customer';
      }
    }

    console.log(`Registering user with role: ${role} (mapped to ${dbRole})`);

    // Create a new user
    const user = await User.create({
      uid: new mongoose.Types.ObjectId().toString(),
      username,
      email,
      password,
      role: dbRole
    });

    // Generate token
    const token = generateToken(user._id);

    // Map the role back to mobile app terminology for response
    const appRole = user.role === 'seller' ? 'freelancer' : 'user';

    // Return user data
    res.status(201).json({
      token,
      user: {
        id: user._id, // MongoDB ObjectId
        uid: user.uid,
        username: user.username,
        email: user.email,
        role: appRole,
        profile: {
          profileImage: user.profileImage
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Failed to register user',
      error: error.message
    });
  }
};

// Login user
// POST /auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if password matches
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Map the role to mobile app terminology for response
    const appRole = user.role === 'seller' ? 'freelancer' : 'user';

    console.log(`User logged in: ${user.email} with role ${user.role} (mapped to ${appRole})`);

    // Return user data
    res.status(200).json({
      token,
      user: {
        id: user._id, // MongoDB ObjectId
        uid: user.uid,
        username: user.username,
        email: user.email,
        role: appRole,
        profile: {
          profileImage: user.profileImage
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Failed to login',
      error: error.message
    });
  }
};

// Get user profile
// GET /auth/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.status(200).json({
      uid: user.uid,
      username: user.username,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

// Update user profile
// PUT /auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { username, profileImage } = req.body;

    // Get the user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Update fields
    if (username) {
      // Check if username is taken
      if (username !== user.username) {
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
          return res.status(400).json({
            message: 'Username already taken'
          });
        }
        user.username = username;
      }
    }

    if (profileImage) {
      user.profileImage = profileImage;
    }

    // Save the updated user
    const updatedUser = await user.save();

    res.status(200).json({
      uid: updatedUser.uid,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      profileImage: updatedUser.profileImage
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Get user profile by ID
// GET /auth/user/:id
exports.getUserById = async (req, res) => {
  try {
    // Check if the provided ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Map the role to mobile app terminology for response
    const appRole = user.role === 'seller' ? 'freelancer' : 'user';

    res.status(200).json({
      id: user._id, // <-- MongoDB ObjectId
      uid: user.uid,
      username: user.username,
      role: appRole,
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      message: 'Failed to get user profile',
      error: error.message
    });
  }
}; 