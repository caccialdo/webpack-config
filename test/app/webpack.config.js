'use strict'

const {getConfig} = require('../../src/index')

module.exports = getConfig(__dirname, {
  entries: {
    app: './index.js'
  },
  options: {
    extractCss: true,
    sourceMap: true,
    withChunkHash: true
  },
  publicPath: '/dist/',
  commonPackages: ['lodash', 'react', 'react-dom']
})
