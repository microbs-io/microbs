/*
 * validate.js
 */

// Main packages
const config = require('../../../config')
const logger = require('../../../logger')
const validate = require('../../../commands/validate')

/**
 * Validate the fields and values of the given config file.
 */
const validateConfig = () => {
  try {
    config.init()
  } catch (e) {
    validate.logFailure('failed to load config.')
    logger.error(e)
    return
  }
  var hasErrors = false

  // Validate required fields
  const requiredAlways = [
    'plugins.grafana_cloud.api_key',
    'plugins.grafana_cloud.org_slug',
    'plugins.grafana_cloud.region',
  ]
  for (var i in requiredAlways) {
    if (!config.get(requiredAlways[i])) {
      hasErrors = true
      validate.logFailure(`'${requiredAlways[i]}' is required but missing from grafana_cloud plugin config.`)
    }
  }

  if (!hasErrors)
    validate.logSuccess(`no problems detected in grafana_cloud plugin config.`)
}

module.exports = async () => {
  validateConfig()
}
