const path = require('path');

module.exports = {
  mode: 'development', // Set to 'production' for production builds
  entry: './src/index.js', // Adjust this if your entry file is different
  output: {
    path: path.resolve(__dirname, 'dist'), // Output directory
    filename: 'index.js', // Output file for Vercel
    libraryTarget: 'commonjs2' // Required for Vercel serverless functions
  },
  target: 'node', // Set target to Node.js
  module: {
    rules: [
      // Add any loaders you need, e.g., Babel for transpiling
    ]
  }
};
