const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background/background.js',
    popup: './src/popup/popup.js',
    options: './src/options/options.js',
    content: './src/content/content.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '.' },
        { from: 'src/popup/index.html', to: 'popup.html' },
        { from: 'src/popup/popup.css', to: 'popup.css' },
        { from: 'src/options/index.html', to: 'options.html' },
        { from: 'src/options/options.css', to: 'options.css' },
        { from: 'src/content/executor.js', to: 'executor.js' },
        { from: 'src/content/scriptExecutor.js', to: 'scriptExecutor.js' },
      ],
    }),
  ],
};
