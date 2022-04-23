/*
 * context.js
 *
 * Stores information about the command execution context and makes it available
 * to the CLI. This includes the command, arguments, and paths to the config
 * file and the microbs project home directory and the config file.
 *
 * Parses the command-line arguments during init().
 */

// Standard packages
const path = require('path')

// Third-party packages
const _ = require('lodash')
const parseArgs = require('minimist')

// Default context
const DEFAULT_CONTEXT = {
  homepath: path.join(process.cwd()),
  filepath: path.join(process.cwd(), 'config.yaml'),
  command: 'help',
  args: { _: [], 'log-level': 'info' }
}

// Global context object
const context = {}

/**
 * Parse command-line arguments and persist them in an immutable context object.
 */
const init = () => {

  // Return the existing context if it exists.
  if (Object.isFrozen(context))
    return context

  // Initialize the context object.
  for (var key in DEFAULT_CONTEXT)
    context[key] = DEFAULT_CONTEXT[key]
  const args = parseArgs(process.argv.slice(2))

  // The command is the first positional argument.
  context.command = args._.shift()

  // Parse remaining arguments.
  for (var key in args) {
    if (!Array.isArray(args[key]))
      args[key] = [ args[key] ]
    for (var i in args[key]) {
      switch (key) {

        case '_':
          context.args._.push(args[key][i])
          break

        // -c | --config  Path to configuration file
        case 'c':
        case 'config':
          context['filepath'] = args[key][i]
          break

        // -i | --indented  Indent logged objects
        case 'i':
        case 'indented':
          context.args['indented'] = true
          break

        // -L | --log-level  Minimum log-level to show in the console
        case 'L':
        case 'log-level':
          const value = (args[key][i].toString() || '').toLowerCase()
          if (![ 'debug', 'info', 'warn', 'error' ].includes(value))
            throw new Error('--log-level must be one of: debug, info, warn, error')
          context.args['log-level'] = value
          break

        // -v | --verbose  Display timestamps and log levels with each log line
        case 'v':
        case 'verbose':
          context.args['verbose'] = true
          break

        // -a | --app  Application under ./apps
        case 'a':
        case 'app':
          context.args['app'] = true
          break

        // -k | --k8s  Kubernetes plugin under ./cli/src/plugins/k8s
        case 'k':
        case 'k8s':
          context.args['k8s'] = true
          break

        // -l | --alerts  Alerts plugin under ./cli/src/plugins/alerts
        case 'l':
        case 'alerts':
          context.args['alerts'] = true
          break

        // -o | --obs  Observability plugin under ./cli/src/plugins/obs
        case 'o':
        case 'obs':
          context.args['obs'] = true
          break
      }
    }
  }

  // Make the context object immutable and then return it.
  return Object.freeze(context)
}

// Export context
module.exports = {
  get: (key) => key ? init()[key] : init(),
  init: () => init
}
