/*
 * plugins.js
 * 
 * Load plugins and persist them to context.
 */

// Standard packages
const path = require('path')

// Main packages
const { config, context, logger } = require('@microbs.io/core')

// Load a plugin
const loadPlugin = (name) => {
  if (!name)
    return null
  return require(`@microbs.io/plugin-${name}`)
}

// Load all plugins invoked in config.yaml
const load = () => {
  
  // Attempt to load each plugin
  const failures = []
  const pluginTypes = [ 'kubernetes', 'observability', 'alerts' ]
  for (var i in pluginTypes) {
    var failure = false
    
    // Require plugin module
    let pluginType = pluginTypes[i]
    let name = config.get(`deployment.plugins.${pluginType}`)
    if (!name)
      continue
    try {
      let plugin = loadPlugin(name)
      let pluginPath = path.dirname(require.resolve(`@microbs.io/plugin-${name}/package.json`))
      if (plugin && pluginPath) {
        context.set(`plugins.${pluginType}`, plugin)
        context.set(`path.plugin.${pluginType}`, pluginPath)
      } else {
        failure = true
      }
    } catch (e) {
      failure = true
      if (!e.message.startsWith(`Cannot find module '@microbs.io/plugin-`)) {
        logger.error(e)
        process.exit(1)
      }
    }
    if (failure)
      failures.push(name)
  }
  if (failures.length) {
    logger.error(``)
    logger.error(`The following plugin${ failures.length === 1 ? ' is' : 's are' } not installed:`)
    logger.error(``)
    logger.error(`    ${failures.join('\n    ')}`)
    logger.error(``)
    logger.error(`Run this command to install ${ failures.length === 1 ? 'it' : 'them' }:`)
    logger.error(``)
    logger.error(`    microbs plugins install ${failures.join(' ')}`)
    logger.error(``)
    process.exit(1)
  }
}

module.exports = {
  load: load,
  get: (type) => {
    switch (type) {
      case 'kubernetes':
        return kubernetes
      case 'observability':
        return observability
      case 'alerts':
        return alerts
      throw new Error(`Unrecognized plugin type: ${type}`)
    }
  }
}
