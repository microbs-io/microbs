/*
 * destroy.js
 *
 * Destroy kind cluster.
 */

// Main packages
const logger = require('../../../logger')
const utils = require('../../../utils')

// Plugin packages
const probe = require('./probe')

module.exports = async () => {
  logger.info('')
  logger.info('Destroying kind cluster...')
  utils.exec('kind delete cluster')

  // Verify that the kind cluster was destroyed.
  logger.info('')
  logger.info('Verifying that kind cluster is destroyed...')
  if (!(await probe.status())) {
    logger.info('...acknowledged. kind is destroyed.')
  } else {
    logger.error('...failure. kind was not destroyed.')
    process.exit(1)
  }
}
