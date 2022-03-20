/*
 * Export all commands.
 *
 * Each command must export an async function named run().
 */
const glob = require('glob')
const path = require('path')
glob.sync(path.join(__dirname, '*.js')).forEach((filepath) => {
  module.exports[path.basename(filepath).replace(/\.js$/, '')] = require(path.resolve(filepath))
})
