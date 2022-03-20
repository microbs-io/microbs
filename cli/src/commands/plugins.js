/*
 * List all available apps.
 */

// Standard packages
const glob = require('glob')
const path = require('path')

// Main packages
const logger = require('../logger')
const plugins = require('../plugins')

module.exports.run = async (opts) => {
  logger.info('')
  logger.info('alerts:')
  for (var plugin in plugins.alerts)
    logger.info(`  - ${plugin}`)
  logger.info('')
  logger.info('k8s:')
  for (var plugin in plugins.k8s)
    logger.info(`  - ${plugin}`)
  logger.info('')
  logger.info('observability:')
  for (var plugin in plugins.obs)
    logger.info(`  - ${plugin}`)
  logger.info('')
}
