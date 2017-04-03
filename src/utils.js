'use strict'

const fs = require('fs')
const path = require('path')
const queryString = require('querystring')

const _compact = require('lodash/compact')
const _isArray = require('lodash/isArray')
const _omitBy = require('lodash/omitBy')

exports.listNodeModules = nodeModulesRoot => {
  try {
    return fs.readdirSync(nodeModulesRoot).filter(
      // Filter out dot directories and scoped packages
      dir => !dir.startsWith('.') && !dir.startsWith('@')
    )
  } catch (err) {
    return []
  }
}

exports.compact = target => {
  if (_isArray(target)) {
    return _compact(target)
  }

  return _omitBy(target, v => v === false)
}

// "?foo&bar=1" => { foo: '', bar: '1' }
exports.parseQueryString = qs => queryString.parse(qs.substr(1))

exports.resolvePath = (...paths) => {
  try {
    return fs.realpathSync(path.join(...paths))
  } catch (err) {
    return false
  }
}
