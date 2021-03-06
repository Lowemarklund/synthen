const path = require('path')
const devConfig = require('./webpack.config.js')

const config = Object.assign({}, devConfig, {
  entry: [
    path.join(__dirname, '/../app/src/js/app.js')
  ]
})

module.exports = config
