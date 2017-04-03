const fs = require('fs')
const path = require('path')

exports.ManifestPlugin = function ManifestPlugin (outputDir, publicPath = '') {
  return function () {
    this.plugin('done', function (stats) {
      const assetsByChunkName = stats.toJson().assetsByChunkName

      const chunksMap = {}
      Object.keys(assetsByChunkName).forEach(chunkName => {
        assetsByChunkName[chunkName].reduce((acc, fileName) => {
          if (!fileName.includes('.map')) {
            const extension = fileName.split('.').pop()
            acc[`${chunkName}.${extension}`] = path.join(publicPath, fileName)
          }

          return acc
        }, chunksMap)
      })

      const chunksJSON = JSON.stringify(chunksMap)
      fs.writeFileSync(
        path.join(outputDir, 'webpack-manifest.json'),
        chunksJSON
      )
      fs.writeFileSync(
        path.join(outputDir, 'webpack-manifest.js'),
        `window.webpackManifest=${chunksJSON}`
      )
    })
  }
}
