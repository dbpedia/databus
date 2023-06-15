const path = require('path');

module.exports = {
  entry: './js/angular-application.js',
  mode: 'development',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  externalsType: 'global',
  externals: {
    "moment/moment": "moment",
    "markdown-it": "markdownit"
  }
};