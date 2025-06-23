// Simple metro configuration
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow importing from node_modules
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Avoid node modules
config.resolver.resolverMainFields = ['browser', 'main'];

module.exports = config; 