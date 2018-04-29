
const path = require('path');
const devConfig = require('./webpack.config.js');

const config = Object.assign({}, devConfig, {
  entry: [
    path.join(__dirname, './src/js/app.js'),
  ],
});

module.exports = config;
