const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    popup: path.resolve(__dirname, 'src', 'index.js')
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: []
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  }
};
