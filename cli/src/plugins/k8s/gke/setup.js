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
    'gcp.project_name',
    'gcp.region_name',
    'gcp.network_name',
    'gcp.subnetwork_name',
    'gcp.service_account_name',
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
  const projectName = config.get('plugins.k8s.gke.project_name')
  const regionName = config.get('plugins.k8s.gke.region_name')
  const networkName = config.get('plugins.k8s.gke.network_name')
  const subnetworkName = config.get('plugins.k8s.gke.subnetwork_name')
  const serviceAccountName = config.get('plugins.k8s.gke.service_account_name')
  const command = `
  gcloud beta container clusters create 'microbs-${quote([ deploymentName ])}' \
      --project "${quote([ projectName ])}" \
      --region "${quote([ regionName ])}" \
      --network "projects/${quote([ projectName ])}/global/networks/${quote([ networkName ])}" \
      --subnetwork "projects/${quote([ projectName ])}/regions/${quote([ regionName ])}/subnetworks/${quote([ subnetworkName ])}" \
      --service-account "${quote([ serviceAccountName ])}" \
      --addons HorizontalPodAutoscaling,HttpLoadBalancing \
      --default-max-pods-per-node "110" \
      --disk-size "32" \
      --disk-type "pd-ssd" \
      --enable-autorepair \
      --enable-autoscaling \
      --enable-ip-alias \
      --image-type "COS" \
      --machine-type "e2-highcpu-16" \
      --max-nodes "1" \
      --metadata disable-legacy-endpoints=true \
      --min-nodes "1" \
      --no-enable-autoupgrade \
      --no-enable-basic-auth \
      --no-enable-master-authorized-networks \
      --no-enable-stackdriver-kubernetes \
      --num-nodes "1"
  `
  console.debug('...sending command:')
  console.debug(command)
  const result = utils.exec(command)

  // Verify that the GKE cluster was created
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
      await utils.sleep(4)
      process.stdout.write('.')
    }
  }
  if (!ready)
    process.exit(1)

  console.log('')
  console.log('Finished setting up GKE.')
}
