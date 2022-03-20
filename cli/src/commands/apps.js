/*
 * List all deployable apps.
 */

// Standard packages
const glob = require('glob')
const path = require('path')

// Main packages
const context = require('../context')

module.exports.run = async (opts) => {
  console.log('')
  console.log('apps:')
  glob.sync(path.join(context.get('homepath'), 'apps', '*/')).forEach((filepath) => {
    console.log(`  - ${path.basename(filepath)}`)
  })
  console.log('')
}
