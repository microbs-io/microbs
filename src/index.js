/*
 * index.js
 *
 * Main entrypoint for the microbs command-line interface (CLI).
 */

// Main packages
const { config, context, logger } = require('@microbs.io/core')
const apps = require('./apps')
const args = require('./args')
const commands = require('./commands')
const plugins = require('./plugins')

/**
 * Run a command.
 */
module.exports.run = async () => {
  
  // Parse and validate the command-line arguments and
  // persist them in the global context object.
  args.parse()
  
  // Prepare the config, apps, and plugins for operational commands.
  switch (context.get('command')) {
    case 'setup':
    case 'rollout':
    case 'stabilize':
    case 'destroy':
      try {
        config.init()
      } catch (err) {
        if (err.code === 'ENOENT') {
          return logger.error(`No configuration file at specified path: ${filepath}`)
        } else {
          throw err
        }
      }
      config.init()
      apps.load()
      plugins.load()
      break
  }
  
  // Run the command.
  switch (context.get('command')) {
    case 'setup':
      return await commands.setup.run()
    case 'rollout':
      return await commands.rollout.run()
    case 'stabilize':
      return await commands.stabilize.run()
    case 'destroy':
      return await commands.destroy.run()
    case 'apps':
      return await commands.apps.run()
    case 'plugins':
      return await commands.plugins.run()
    case 'init':
      return await commands.init.run()
    case 'validate':
      return await commands.validate.run()
    case 'version':
      return await commands.version.run()
    default:
      return await commands.help.run()
  }
}

if (require.main === module)
  module.exports.run()
