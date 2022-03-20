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
    logger.error('... failed to load config.')
    logger.error(e)
    return
  }
  var hasErrors = false

  // Validate required fields
  const requiredAlways = [
    'plugins.elastic_cloud.api_key',
    'plugins.elastic_cloud.region',
    'plugins.elastic_cloud.version',
  ]
  for (var i in requiredAlways) {
    if (!config.get(requiredAlways[i])) {
      hasErrors = true
      validate.logFailure(`'${requiredAlways[i]}' is required but missing from elastic_cloud plugin config.`)
    }
  }

  if (!hasErrors)
    validate.logSuccess('no problems detected in elastic_cloud plugin config.')
}

module.exports = async () => {
  validateConfig()
}
