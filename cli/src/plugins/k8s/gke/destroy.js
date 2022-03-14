// Standard packages
const process = require('process')

// Third-party packages
const quote = require('shell-quote').quote

// Main packages
const config = require('../../../config.js')
const utils = require('../../../utils.js')

// Plugin packages
const probe = require('./probe.js')

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
    console.error()
    console.error(`You must set these variables in ${config.get('_context.filepath')} to destroy GKE:`)
    console.error()
    console.error(requiredFields)
    process.exit(1)
  }
}


module.exports = async () => {
  validate()

  console.log('')
  console.log(`Destroying GKE cluster 'microbs-${config.get('deployment.name')}'...`)

  // Check if the GKE cluster exists
  if (await probe.status() === 'NOT_FOUND')
    return console.log(`...skipping. GKE cluster does not exist.`)

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
  console.debug('...sending command:')
  console.debug(command)
  const res = utils.exec(command, true)
  if (res.stderr)
    console.warn(res.stderr)
  console.log('')

  // Verify that the GKE cluster was destroyed
  if (await probe.status() === 'NOT_FOUND')
    console.log(`...acknowledged. GKE cluster destroyed.`)
}
