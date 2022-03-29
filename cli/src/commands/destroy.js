/**
 * Run the destroy command(s) of the given plugin(s).
 * Start with the application services, then the observability solution,
 * then the Kubernetes cluster.
 */

// Main packages
const config = require('../config')
const context = require('../context')
const logger = require('../logger')
const plugins = require('../plugins')
const rollout = require('./rollout')

module.exports.run = async () => {
  const args = context.get('args')
  const pluginTypes = [ 'alerts', 'obs', 'k8s' ]

  // Determine which plugins(s) to invoke for this command.
  const all = (!args.alerts && !args.app && !args.k8s && !args.obs)

  // Remove the application services, if given.
  if (all || args.app) {
    await rollout.run({ action: 'delete' })

    // Invoke the 'onDestroyApp' hook for each plugin that implements it.
    for (var i in pluginTypes) {
      let pluginType = pluginTypes[i]
      var pluginName = config.get(`deployment.plugins.${pluginType}`)
      var plugin = plugins[pluginType][pluginName]
      if (plugin) {
        if (plugin.hooks && plugin.hooks.onDestroyApp) {
          logger.debug(`Calling 'onDestroyApp' from the '${pluginName}' ${pluginType} plugin.`)
          await plugin.hooks.onDestroyApp()
        } else {
          logger.debug(`The '${pluginName}' ${pluginType} plugin does not implement the 'onDestroyApp' command.`)
        }
      } else {
        logger.debug(`No ${pluginType} plugin was defined in the config file.`)
      }
    }
  }

  // Invoke the 'destroy' command for each plugin that implements it.
  for (var i in pluginTypes) {
    let pluginType = pluginTypes[i]
    if (all || args[pluginType]) {
      var pluginName = config.get(`deployment.plugins.${pluginType}`)
      var plugin = plugins[pluginType][pluginName]
      if (plugin) {
        if (plugin.destroy) {
          await plugin.destroy()
        } else {
          logger.debug(`The '${pluginName}' ${pluginType} plugin does not implement the 'destroy' command.`)
        }
      } else {
        logger.debug(`No ${pluginType} plugin was defined in the config file.`)
      }
    }
  }
}
