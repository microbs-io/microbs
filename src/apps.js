/*
 * apps.js
 * 
 * Load an app and persist its filepath to context.
 */

// Standard packages
const path = require('path')

// Main packages
const { config, context, logger } = require('@microbs.io/core')

// Load the app invoked in config.yaml
const load = () => {
  const name = config.get('deployment.app')
  if (!name)
    return
  var failure
  try {
    const pathApp = path.dirname(require.resolve(`@microbs.io/app-${name}/package.json`))
    if (pathApp)
      context.set('path.app', pathApp)
  } catch (e) {
    failure = true
    if (!e.message.startsWith(`Cannot find module '@microbs.io/app-`)) {
      logger.error(e)
      process.exit(1)
    }
  }
  if (failure) {
    logger.error(``)
    logger.error(`The following app is not installed:`)
    logger.error(``)
    logger.error(`    ${name}`)
    logger.error(``)
    logger.error(`Run this command to install it:`)
    logger.error(``)
    logger.error(`    microbs apps install ${name}`)
    logger.error(``)
    process.exit(1)
  }
}

module.exports = {
  load: load
}
