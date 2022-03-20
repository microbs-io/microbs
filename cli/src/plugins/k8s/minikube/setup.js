/*
 * setup.js
 *
 * Setup minikube cluster.
 */

// Main packages
const logger = require('../../../logger')
const utils = require('../../../utils')

// Plugin packages
const probe = require('./probe')

module.exports = async () => {
  logger.info('')
  logger.info('Creating minikube cluster...')
  utils.exec('minikube start', true)

  // Verify that the minikube cluster was created.
  logger.info('')
  logger.info('Verifying that minikube is available...')
  if (await probe.status()) {
    logger.info('...acknowledged. minikube is ready.\n')
  } else {
    logger.error('...failure. minikube did not start successfully.\n')
    process.exit(1)
  }
}
