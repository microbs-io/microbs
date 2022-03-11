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
    'plugins.gke.network_name',
    'plugins.gke.subnetwork_name',
    'plugins.gke.service_account_name',
  ]
  if (!utils.configHas(requiredFields)) {
    console.error()
    console.error(`You must set these variables in ${config.get('_context.filepath')} to setup GKE:`)
    console.error()
    console.error(requiredFields)
    process.exit(1)
  }
}


module.exports = async () => {
  validate()
  console.log('')
  console.log('Creating GKE cluster...')
  const deploymentName = config.get('deployment.name')
  const projectName = config.get('plugins.gke.project_name')
  const regionName = config.get('plugins.gke.region_name')
  const networkName = config.get('plugins.gke.network_name')
  const subnetworkName = config.get('plugins.gke.subnetwork_name')
  const serviceAccountName = config.get('plugins.gke.service_account_name')
  const command = `
  gcloud beta container clusters create 'microbs-${quote([ deploymentName ])}' \
      --project "${quote([ projectName ])}" \
      --region "${quote([ regionName ])}" \
      --network "projects/${quote([ projectName ])}/global/networks/${quote([ networkName ])}" \
      --subnetwork "projects/${quote([ projectName ])}/regions/${quote([ regionName ])}/subnetworks/${quote([ subnetworkName ])}" \
      --service-account "${quote([ serviceAccountName ]).replace('\\@', '@')}" \
      --addons HorizontalPodAutoscaling,HttpLoadBalancing,GcePersistentDiskCsiDriver \
      --cluster-version "1.21.6-gke.1503" \
      --default-max-pods-per-node "110" \
      --disk-size "32" \
      --disk-type "pd-ssd" \
      --enable-autorepair \
      --enable-autoupgrade \
      --enable-ip-alias \
      --image-type "COS_CONTAINERD" \
      --machine-type "e2-highcpu-4" \
      --max-pods-per-node "110" \
      --max-surge-upgrade 1 \
      --max-unavailable-upgrade 0 \
      --metadata disable-legacy-endpoints=true \
      --no-enable-basic-auth \
      --no-enable-intra-node-visibility \
      --no-enable-master-authorized-networks \
      --no-shielded-integrity-monitoring \
      --num-nodes "1" \
      --release-channel "regular"
  `
  console.debug('...sending command:')
  console.debug(command)
  const result = utils.exec(command, true)
  const exists = result.stderr ? result.stderr.includes('Already exists:') : false
  if (result.stderr)
    console.warn(result.stderr)

  // Exit if there was an issue creating the cluster
  if (result.stderr && result.stderr.includes('ERROR:') && !exists)
    process.exit(1)

  // Verify that the GKE cluster was created
  if (!exists) {
    console.log('')
    console.log('Waiting for GKE cluster to be available...')
    process.stdout.write('...')
    var verified = false
    var ready = false
    while (!verified) {
      if (await probe.status()) {
        process.stdout.write('ready.\n')
        ready = true
        verified = true
      } else {
        await utils.sleep(4000)
        process.stdout.write('.')
      }
    }
    if (!ready)
      process.exit(1)
  }

  console.log('')
  console.log('Finished setting up GKE.')
}
