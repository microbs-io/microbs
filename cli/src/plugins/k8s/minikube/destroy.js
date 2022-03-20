/*
 * destroy.js
 *
 * Destroy minikube cluster.
 */

// Main packages
const logger = require('../../../logger')
const utils = require('../../../utils')

// Plugin packages
const probe = require('./probe')

module.exports = async () => {
  logger.info('')
  logger.info('Destroying minikube cluster...')
  utils.exec('minikube delete')

  // Verify that the minikube cluster was destroyed.
  logger.info('')
  logger.info('Verifying that minikube cluster is destroyed...')
  if (!(await probe.status())) {
    logger.info('...acknowledged. minikube is destroyed.')
  } else {
    logger.error('...failure. minikube was not destroyed.')
    process.exit(1)
  }
}
