/*
 * Run the setup command(s) of the given plugin(s).
 * Start with the Kubernetes cluster, then the observability solution,
 * then the application services.
 */

// Standard packages
const path = require('path')

// Main packages
const { config, context, logger, utils } = require('@microbs.io/core')
const hooks = require('../hooks')
const rollout = require('./rollout')

module.exports.run = async () => {
  const args = context.get('args')
  const pluginTypes = [ 'alerts', 'kubernetes', 'observability' ]

  // Determine which plugins(s) to invoke for this command.
  const all = (!args.alerts && !args.app && !args.kubernetes && !args.observability)

  // Invoke the 'setup' command for each plugin that implements it.
  for (var i in pluginTypes) {
    let pluginType = pluginTypes[i]
    if (all || args[pluginType]) {
      var pluginName = config.get(`deployment.plugins.${pluginType}`)
      var plugin = context.get(`plugins.${pluginType}`)
      if (plugin) {
        if (plugin.setup) {
          await hooks.run(`before_setup_${pluginType}`)
          await plugin.setup()
          await hooks.run(`after_setup_${pluginType}`)
        } else {
          logger.debug(`The '${pluginName}' ${pluginType} plugin does not implement the 'setup' command.`)
        }
      } else {
        logger.debug(`No ${pluginType} plugin was defined in the config file.`)
      }
    }
  }

  // Rollout the application services for the 'main' profile, if applicable.
  if (all || args.app) {
    await hooks.run('before_setup_app')
    await rollout.run({ profile: 'main' })
    await hooks.run('after_setup_app')
  }
}
