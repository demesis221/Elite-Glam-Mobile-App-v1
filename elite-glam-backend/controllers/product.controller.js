const Product = require('../models/product.model');
const Rating = require('../models/rating.model');
const mongoose = require('mongoose');

// Get all products
// GET /products
exports.getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, size } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    if (size) {
      filter.size = { $in: Array.isArray(size) ? size : [size] };
    }
    
    const products = await Product.find(filter).sort({ createdAt: -1 });
    
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to get products',
      error: error.message
    });
  }
};

// Get a single product by id
// GET /products/:id
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to get product',
      error: error.message
    });
  }
};

// Create a new product
// POST /products
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, size, image, images, location, hasMakeupService, makeupPrice, makeupDescription, makeupDuration } = req.body;
    
    // Validate required fields
    if (!name || !description || !price || !category || !size || !image) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Log the user object for debugging
    console.log('[Product Creation] req.user:', req.user);
    
    console.log('Received makeup data:', {
      hasMakeupService: req.body.hasMakeupService,
      makeupPrice: req.body.makeupPrice,
      makeupDescription: req.body.makeupDescription,
      makeupDuration: req.body.makeupDuration
    });
    
    // Create the product
    const product = await Product.create({
      name,
      description,
      price: Number(price),
      category,
      size: Array.isArray(size) ? size : [size],
      image,
      images: images || [],
      userId: req.user._id,
      location: location || 'Location not specified',
      hasMakeupService,
      makeupPrice,
      makeupDescription,
      makeupDuration
    });
    console.log('[Product Creation] Assigned userId:', req.user._id, 'for product:', product._id);
    
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to create product',
      error: error.message
    });
  }
};

// Update a product
// PUT /products/:id
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, size, image, images, location } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user is the owner
    if (product.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }
    
    // Update fields
    const updatedFields = {
      name: name || product.name,
      description: description || product.description,
      price: price ? Number(price) : product.price,
      category: category || product.category,
      size: size ? (Array.isArray(size) ? size : [size]) : product.size,
      image: image || product.image,
      images: images || product.images,
      location: location || product.location
    };
    
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true }
    );
    
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// Delete a product
// DELETE /products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user is the owner
    if (product.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }
    
    await Product.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

// Search products
// GET /products/search
exports.searchProducts = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    });
    
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to search products',
      error: error.message
    });
  }
}; 

// Get all products for a specific user
// GET /products/user/:userId
exports.getProductsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const products = await Product.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products by user:', error);
    res.status(500).json({
      message: 'Failed to get user products',
      error: error.message,
    });
  }
};