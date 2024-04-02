const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');


module.exports = {
  // The entry point file described above
  entry: './src/index.js',
  resolve: {
    fallback: {
		crypto: require.resolve("crypto-browserify"),
		buffer: require.resolve("buffer/")
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  plugins: [
		new NodePolyfillPlugin()
	]
};