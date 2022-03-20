// Third-party packages
const quote = require('shell-quote').quote

// Main packages
const config = require('../../../config')
const context = require('../../../context')
const logger = require('../../../logger')
const utils = require('../../../utils')

// Plugin packages
const probe = require('./probe')

/**
 * Validation for setting up GKE
 */
const validate = () => {
  const requiredFields = [
    'deployment.name',
    'plugins.gke.project_name',
    'plugins.gke.region_name',
  ]
  if (!utils.configHas(requiredFields)) {
    logger.error()
    logger.error(`You must set these variables in ${context.get('filepath')} to destroy GKE:`)
    logger.error()
    logger.error(requiredFields)
    process.exit(1)
  }
}


module.exports = async () => {
  validate()

  logger.info('')
  logger.info(`Destroying GKE cluster 'microbs-${config.get('deployment.name')}'...`)

  // Check if the GKE cluster exists
  if (await probe.status() === 'NOT_FOUND')
    return logger.info(`...skipping. GKE cluster does not exist.`)

  // Destroy the GKE cluster
  const deploymentName = config.get('deployment.name')
  const projectName = config.get('plugins.gke.project_name')
  const regionName = config.get('plugins.gke.region_name')
  const networkName = config.get('plugins.gke.network_name')
  const subnetworkName = config.get('plugins.gke.subnetwork_name')
  const serviceAccountName = config.get('plugins.gke.service_account_name')
  const command = `
  gcloud container clusters delete 'microbs-${quote([ deploymentName ])}' \
      --project "${quote([ projectName ])}" \
      --region "${quote([ regionName ])}" \
      --quiet
  `
  logger.debug('...sending command:')
  logger.debug(command)
  const res = utils.exec(command, true)
  if (res.stderr)
    logger.warn(res.stderr)
  logger.info('')

  // Verify that the GKE cluster was destroyed
  if (await probe.status() === 'NOT_FOUND')
    logger.info(`...acknowledged. GKE cluster destroyed.`)
}
