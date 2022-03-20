/*
 * index.js
 *
 * Main entrypoint for the microbs command-line interface (CLI).
 */

// Main packages
const commands = require('./commands')
const config = require('./config')
const context = require('./context')

/**
 * Run a command.
 */
module.exports.run = async (ctx) => {
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
    case 'validate':
      return await commands.validate.run()
    default:
      return await commands.help.run()
  }
}

if (require.main === module)
  module.exports.run()
