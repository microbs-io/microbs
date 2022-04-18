// Third-party packages
const quote = require('shell-quote').quote

// Main packages
const config = require('../../../config')
const logger = require('../../../logger')
const utils = require('../../../utils')

// Regular expressions
const RE_STATUS = new RegExp(/^status: (.*)/g, 'm')

const describe = async () => {
  if (!config.get('deployment.name') || !config.get('plugins.gke.project_name') || !config.get('plugins.gke.region_name'))
    return null
  const projectName = config.get('plugins.gke.project_name')
  const regionName = config.get('plugins.gke.region_name')
  const deploymentName = config.get('deployment.name')
  const command = `
  gcloud container clusters describe "microbs-${quote([ deploymentName ])}" \\
      --project "${quote([ projectName ])}" \\
      --region "${quote([ regionName ])}"
  `
  return utils.exec(command, true)
}

module.exports.describe = describe

module.exports.status = async () => {
  const result = await describe()
  if (result.code > 0) {
    logger.error('Error from GKE:')
    logger.error('')
    logger.error(result.stderr || result.stdout)
    process.exit(1)
  }
  if (result.stderr) {
    // Return NOT_FOUND
    if (result.stderr.includes('Not found:'))
      return 'NOT_FOUND'
  } else {
    // Return RUNNING
    const status = result.stdout.match(RE_STATUS)
    if (status && status[1] == 'RUNNING')
      return 'RUNNING'
  }
  // Return unexpected result
  return result;
}
