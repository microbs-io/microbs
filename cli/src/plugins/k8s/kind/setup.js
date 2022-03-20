/*
 * setup.js
 *
 * Setup kind cluster.
 */

// Main packages
const logger = require('../../../logger')
const utils = require('../../../utils')

// Plugin packages
const probe = require('./probe')

module.exports = async () => {
  logger.info('')
  logger.info('Creating kind cluster...')
  utils.exec('kind create cluster')

  // Verify that the kind cluster was created.
  logger.info('')
  logger.info('Verifying that kind is available...')
  if (await probe.status()) {
    logger.info('...acknowledged. kind is ready.\n')
  } else {
    logger.error('...failure. kind did not start successfully.\n')
    process.exit(1)
  }
}
