/*
 * Export all plugin directories.
 */
const glob = require('glob')
const path = require('path')
glob.sync(path.join(__dirname, '*/')).forEach((filepath) => {
  module.exports[path.basename(filepath)] = require(path.resolve(filepath))
})
