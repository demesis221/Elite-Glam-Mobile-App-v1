module.exports = function(api) {
  api.cache(true);
  return {
    // Only use 'babel-preset-expo' in Expo projects. Do NOT use '@react-native/babel-preset' directly.
    presets: [
      ['babel-preset-expo', {
        loose: true
        // jsxRuntime: 'classic' // Uncomment if you want classic JSX runtime
      }]
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};