/*
 * validate.js
 */

// Main packages
const config = require('../../../config')

/**
 * Validate the fields and values of the given config file.
 */
const validateConfig = () => {
  try {
    config.init()
  } catch (e) {
    console.error('... failed to load config.')
    console.error(e)
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
      console.error(`... '${requiredAlways[i]}' is required but missing from slack plugin config.`)
    }
  }

  if (!hasErrors)
    console.info('... no problems detected in slack plugin config.')
}

module.exports = async () => {
  validateConfig()
}
