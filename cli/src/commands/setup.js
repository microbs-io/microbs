/*
 * Run the setup command(s) of the given plugin(s).
 * Start with the Kubernetes cluster, then the observability solution,
 * then the application services.
 */

// Main packages
const config = require('../config')
const context = require('../context')
const logger = require('../logger')
const plugins = require('../plugins')
const rollout = require('./rollout')

module.exports.run = async () => {
  const args = context.get('args')

  // Determine which plugins(s) to invoke for this command.
  const all = (!args.alerts && !args.app && !args.k8s && !args.obs)

  // Invoke the 'setup' command for each plugin that implements it.
  const pluginTypes = [ 'alerts', 'k8s', 'obs' ]
  for (var i in pluginTypes) {
    let pluginType = pluginTypes[i]
    if (all || args[pluginType]) {
      var pluginName = config.get(`deployment.plugins.${pluginType}`)
      var plugin = plugins[pluginType][pluginName]
      if (plugin) {
        if (plugin.setup) {
          await plugin.setup()
        } else {
          logger.debug(`The '${pluginName}' ${pluginType} plugin does not implement the 'setup' command.`)
        }
      } else {
        logger.debug(`No ${pluginType} plugin was defined in the config file.`)
      }
    }
  }

  // Rollout the application services for the 'main' profile, if applicable.
  if (all || args.app)
    await rollout.run({ profile: 'main' })
}
