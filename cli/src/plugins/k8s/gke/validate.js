/*
 * validate.js
 */

// Third-party packages
const hasbin = require('hasbin')
const semver = require('semver')

// Main packages
const config = require('../../../config.js')
const utils = require('../../../utils.js')

/**
 * Validate gcloud installation
 */
const validateGcloudInstallation = () => {
  if(hasbin.sync('gcloud'))
    console.info('... gcloud is installed')
  else
    console.warn('... gcloud is not installed')
}

/**
 * Validate gcloud version
 */
const validateGcloudVersion = () => {
  const result = utils.exec('gcloud version', true)
  if (result.stdout) {
    try {
      versionActual = semver.clean(result.stdout.match(/Google Cloud SDK (.+)/)[1])
      versionRequired = semver.clean('372.0.0')
      if (semver.gte(versionActual, versionRequired))
        console.info(`... gcloud is correct version [using=${versionActual}, required>=${versionRequired}]`)
      else
        console.warn(`... gcloud is incorrect version [using=${versionActual}, required>=${versionRequired}]`)
    } catch (e) {
      console.error(e)
    }
  } else {
    console.warn(result.stderr)
  }
}

/**
 * Validate the fields and values of the given config file.
 */
const validateConfig = () => {
  try {
    config.load()
  } catch (e) {
    console.error('... failed to load config.')
    console.error(e)
    return
  }
  var hasErrors = false

  // Validate required fields
  const requiredAlways = [
    'plugins.gke.project_name',
    'plugins.gke.region_name',
    'plugins.gke.network_name',
    'plugins.gke.subnetwork_name',
    'plugins.gke.service_account_name',
    'plugins.gke.service_account_key_path',
  ]
  for (var i in requiredAlways) {
    if (!config.get(requiredAlways[i])) {
      hasErrors = true
      console.error(`... '${requiredAlways[i]}' is required but missing from gke plugin config.`)
    }
  }

  if (!hasErrors)
    console.info('... no problems detected in gke plugin config.')
}

module.exports = async () => {
  validateGcloudInstallation()
  validateGcloudVersion()
  validateConfig()
}
