'use strict'

const autoprefixer = require('autoprefixer')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const mkdirp = require('mkdirp')
const path = require('path')
const Stats = require('webpack/lib/Stats')
const webpack = require('webpack')

const _assign = require('lodash/assign')
const _defaults = require('lodash/defaults')

const {
  compact,
  listNodeModules,
  parseQueryString,
  resolvePath
} = require('./utils')

const {ManifestPlugin} = require('./plugins')

const NODE_ENV = process.env.NODE_ENV || 'development'

function getConfig (
  projectRoot,
  {
    autoprefixerBrowsers = ['last 2 versions', 'Safari >= 8'],
    commonPackages = [],
    entries = {},
    eslintLoaderConfig = {},
    importRoots = [], // other than node_modules
    options = {},
    outputDir = path.join(projectRoot, 'dist'),
    publicPath = '/',
    filterJs = fullPath => !fullPath.includes('node_modules')
  } = {}
) {
  _defaults(options, {
    eslint: false,
    extractCss: true,
    hotModuleReload: false,
    minifyJs: false,
    node: false,
    sourceMap: false,
    watch: false,
    withChunkHash: false
  })

  if (!resolvePath(outputDir)) {
    mkdirp.sync(outputDir)
  }

  const withCommonPackages = commonPackages.length > 0

  const realProjectRoot = resolvePath(projectRoot)
  const nodeModulesRoot = resolvePath(projectRoot, 'node_modules')
  const nodeModulesList = listNodeModules(nodeModulesRoot)

  const fileNameTemplate = options.withChunkHash
    ? '[name].[chunkhash]'
    : '[name]'

  const chunkNameTemplate = options.withChunkHash ? '[id].[chunkhash]' : '[id]'

  const cssLoaders = ({modules = false} = {}) => [
    {
      loader: options.extractCss ? 'css-loader' : 'css-loader/locals',
      options: {
        // Activate minification (without destructive removal of autoprefixer prefixes)
        minimize: true,
        autoprefixer: false,
        // CSS source maps temporarily deactivated while require() context issues are fixed
        sourceMap: options.sourceMap,
        modules
      }
    },
    {loader: 'postcss-loader'}
  ]

  return compact({
    entry: compact(
      _assign(
        {},
        {
          common: withCommonPackages && commonPackages
        },
        entries
      )
    ),

    output: compact({
      path: outputDir,
      publicPath,
      filename: `${fileNameTemplate}.js`,
      chunkFilename: `${chunkNameTemplate}.js`,
      libraryTarget: options.node && 'commonjs2'
    }),

    watch: options.watch,

    target: options.node && 'node',

    devtool: options.sourceMap && 'source-map',

    resolve: {
      extensions: ['.js', '.jsx'],
      modules: compact(
        [].concat(
          'node_modules',
          nodeModulesRoot,
          importRoots.map(root => resolvePath(root))
        )
      )
    },

    resolveLoader: {
      modules: ['node_modules']
    },

    module: {
      rules: compact([
        {
          enforce: 'pre',
          test: /\.less$/,
          loader: 'less-loader'
        },
        {
          enforce: 'pre',
          test: /\.(sass|scss)$/,
          loader: 'sass-loader',
          options: {
            outputStyle: 'compressed',
            // CSS source maps temporarily deactivated while require() context issues are fixed
            sourceMap: options.sourceMap
          }
        },
        {
          test: /\.(png|jpe?g|svg|gif)$/,
          loader: 'url-loader',
          options: {
            limit: 5000
          }
        },
        {
          test: /\.jsx?$/,
          include: filterJs,
          use: compact([
            'babel-loader',
            options.eslint && {
              loader: 'eslint-loader',
              options: eslintLoaderConfig
            }
          ])
        },
        {
          oneOf: [
            {
              test: /\.(css|sass|scss|less)$/,
              // ./my-styles.css?modules OR ./my-styles.css?modules=true
              resourceQuery: qs =>
                ['', 'true'].includes(parseQueryString(qs).modules),
              use: cssLoaders({modules: true})
            },
            {
              test: /\.(css|sass|scss|less)$/,
              use: cssLoaders()
            }
          ]
        },

        options.extractCss && {
          enforce: 'post',
          test: /\.(css|sass|scss|less)$/,
          loader: ExtractTextPlugin.loader({remove: true})
        }
      ])
    },

    plugins: compact([
      new webpack.LoaderOptionsPlugin({
        minimize: options.minifyJs,
        options: {
          context: realProjectRoot,
          postcss: [
            autoprefixer({
              browsers: autoprefixerBrowsers,
              cascade: false
            })
          ]
        }
      }),
      new webpack.DefinePlugin({
        'process.env': {NODE_ENV: JSON.stringify(NODE_ENV)}
      }),

      options.extractCss &&
        new ExtractTextPlugin({filename: `${fileNameTemplate}.css`}),
      options.hotModuleReload && new webpack.HotModuleReplacementPlugin(),
      // prints more readable module names in the browser console on HMR updates
      options.hotModuleReload && new webpack.NamedModulesPlugin(),
      options.minifyJs &&
        new webpack.optimize.UglifyJsPlugin({sourceMap: options.sourceMap}),
      withCommonPackages &&
        new webpack.optimize.CommonsChunkPlugin({
          names: ['common', 'common-manifest'],
          minChunks: Infinity
        }),
      options.withChunkHash && ManifestPlugin(outputDir, publicPath)
    ]),

    externals: options.node &&
      nodeModulesList.reduce(
        (acc, packageName) =>
          _assign({}, acc, {
            [packageName]: `commonjs ${packageName}`
          }),
        {}
      ),

    performance: {
      // Do not apply any size restriction to the vendors bundle
      assetFilter: filename => !/vendors/.test(filename),
      maxEntrypointSize: 5e6, // 5MB
      maxAssetSize: 5e6 // 5MB
    },

    stats: Stats.presetToOptions('minimal')
  })
}

module.exports = {
  getConfig
}
