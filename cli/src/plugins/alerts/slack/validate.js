/*
 * validate.js
 */

// Main packages
const config = require('../../../config')
const logger = require('../../../logger')
const utils = require('../../../utils')
const validate = require('../../../commands/validate')

/**
 * Validate the fields and values of the given config file.
 */
const validateConfig = () => {
  try {
    config.init()
  } catch (e) {
    validate.logFailure('... failed to load config.')
    logger.error(e)
    return
  }
  var hasErrors = false

  // Validate required fields
  const requiredAlways = [
    'plugins.slack.bot_user_oauth_access_token',
  ]
  for (var i in requiredAlways) {
    if (!config.get(requiredAlways[i])) {
      hasErrors = true
      validate.logFailure(`'${requiredAlways[i]}' is required but missing from slack plugin config.`)
    }
  }

  if (!hasErrors)
    validate.logSuccess('no problems detected in slack plugin config.')
}

module.exports = async () => {
  validateConfig()
}
