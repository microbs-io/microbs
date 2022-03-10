// Standard packages
const process = require('process')

// Third-party packages
const quote = require('shell-quote').quote

// Main packages
const config = require('../../../config.js')
const utils = require('../../../utils.js')

// Regular expressions
const RE_STATUS = new RegExp(/^status: (.*)/g, 'm')

module.exports.status = async () => {
  if (!config.get('deployment.name') || !config.get('plugins.k8s.gke.project_name') || !config.get('plugins.k8s.gke.region_name'))
    return null
  const projectName = config.get('plugins.k8s.gke.project_name')
  const regionName = config.get('plugins.k8s.gke.region_name')
  const deploymentName = config.get('deployment.name')
  const command = `gcloud beta container clusters describe "projects/${quote([ projectName ])}/zones/${quote([ regionName ])}/clusters/microbs-${quote([ deploymentName ])}"`
  const result = utils.exec(command, true)
  if (result.code > 0) {
    console.error('Error from GKE:')
    console.error('')
    console.error(result.stderr || result.stdout)
    process.exit(1)
  }
  const status = result.stdout.match(RE_STATUS)
  if (status)
    return status[1] == 'RUNNING'
  return false
}
