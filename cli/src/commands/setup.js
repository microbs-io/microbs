/*
 * Run the setup command(s) of the given plugin(s).
 * Start with the Kubernetes cluster, then the observability solution,
 * then the application services.
 */

// Standard packages
const path = require('path')

// Main packages
const config = require('../config')
const context = require('../context')
const hooks = require('../hooks')
const logger = require('../logger')
const plugins = require('../plugins')
const rollout = require('./rollout')
const utils = require('../utils')

// Third-party packages
const quote = require('shell-quote').quote

/*
// TODO: Implement
const setupKubeStateMetrics = async (opts) => {
  logger.info('')
  logger.info('Setting up kube-state-metrics...')
  var opts = opts || {}
  if (!opts.namespace)
    opts.namespace = 'kube-system'
  const filepath = path.join(context.get('homepath'), 'cli', 'lib', 'kube-state-metrics', 'standard')
  utils.exec(`kubectl apply -f ${quote([ filepath ])} --namespace=${quote([ opts.namespace ])}`)
  logger.info('...done.')
}
*/

module.exports.run = async () => {
  const args = context.get('args')
  const pluginTypes = [ 'alerts', 'k8s', 'obs' ]

  // Determine which plugins(s) to invoke for this command.
  const all = (!args.alerts && !args.app && !args.k8s && !args.obs)

  // Invoke the 'setup' command for each plugin that implements it.
  for (var i in pluginTypes) {
    let pluginType = pluginTypes[i]
    if (all || args[pluginType]) {
      var pluginName = config.get(`deployment.plugins.${pluginType}`)
      var plugin = plugins[pluginType][pluginName]
      if (plugin) {
        if (plugin.setup) {
          await hooks.run(`before_setup_${pluginType}`)
          await plugin.setup()
          await hooks.run(`after_setup_${pluginType}`)
          // TODO: Implement
          //if (pluginType == 'k8s')
          //  await setupKubeStateMetrics()
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
