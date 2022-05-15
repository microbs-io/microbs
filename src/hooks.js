/*
 * hooks.js
 * 
 * Invokes plugin hooks.
 */

// Main packages
const { config, context, logger } = require('@microbs.io/core')

const VALID_HOOKS = {
  after_destroy_alerts: true,
  after_destroy_app: true,
  after_destroy_kubernetes: true,
  after_destroy_observability: true,
  after_setup_alerts: true,
  after_setup_app: true,
  after_setup_kubernetes: true,
  after_setup_observability: true,
  after_rollout: true,
  before_destroy_alerts: true,
  before_destroy_app: true,
  before_destroy_kubernetes: true,
  before_destroy_observability: true,
  before_setup_alerts: true,
  before_setup_app: true,
  before_setup_kubernetes: true,
  before_setup_observability: true,
  before_rollout: true,
}

/**
 * Invoke a given hook for a given plugin.
 */
const runOne = async (hook, pluginType) => {
  if (!VALID_HOOKS[hook])
    throw new Error(`${hook} is not a recognized hook.`)
  const pluginName = config.get(`deployment.plugins.${pluginType}`)
  const plugin = context.get(`plugins.${pluginType}`)
  if (plugin) {
    if (plugin.hooks && plugin.hooks[hook]) {
      logger.debug(`Calling '${hook}' from the '${pluginName}' ${pluginType} plugin.`)
      await plugin.hooks[hook]()
    } else {
      logger.debug(`The '${pluginName}' ${pluginType} plugin does not implement '${hook}'.`)
    }
  } else {
    logger.debug(`No ${pluginType} plugin was defined in the config file.`)
  }
}

/**
 * Invoke a given hook for all configured plugins of a given set of plugin types.
 */
const run = async (hook, pluginTypes) => {
  if (!VALID_HOOKS[hook])
    throw new Error(`${hook} is not a recognized hook.`)
  pluginTypes = pluginTypes || [ 'alerts', 'kubernetes', 'observability' ]
  for (var i in pluginTypes)
    await runOne(hook, pluginTypes[i])
}

module.exports = {
  runOne: runOne,
  run: run,
  VALID_HOOKS: VALID_HOOKS
}
