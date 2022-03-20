/*
 * List all deployable apps.
 */

// Standard packages
const glob = require('glob')
const path = require('path')

// Main packages
const context = require('../context')
const logger = require('../logger')

module.exports.run = async (opts) => {
  logger.info('')
  logger.info('apps:')
  glob.sync(path.join(context.get('homepath'), 'apps', '*/')).forEach((filepath) => {
    logger.info(`  - ${path.basename(filepath)}`)
  })
  logger.info('')
}
