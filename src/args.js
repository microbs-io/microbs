/*
 * parse.js
 *
 * Parse command-line arguments and persist it in the global context.
 */

// Standard packages
const fs = require('fs')
const os = require('os')
const path = require('path')

// Third-party packages
const _ = require('lodash')
const parseArgs = require('minimist')

// Main packages
const { context } = require('@microbs.io/core')

// Default context
const defaults = {}
defaults.command = 'help'
defaults.args = { _: [], 'log-level': 'info' }
defaults.path = {}
defaults.path.cli = path.join(__dirname, '..')
// If $CWD/config.yaml exists, then the default config path is $CWD,
// otherwise the default config path is $HOME/.microbs exists.
if (fs.existsSync(path.join(process.cwd(), 'config.yaml')))
  defaults.path.user = process.cwd()
else
  defaults.path.user = path.join(os.homedir(), '.microbs')
defaults.path.config = path.join(defaults.path.user, 'config.yaml')
defaults.path.state = path.join(defaults.path.user, 'state.yaml')
defaults.path.env = path.join(defaults.path.user, '.env')

/**
 * Parse command-line arguments.
 */
const parse = (argv) => {
  argv = argv || process.argv

  // Initialize the parsed object with the default context.
  const parsed = _.cloneDeep(defaults)
  const args = parseArgs(argv.slice(2))

  // The command is the first positional argument.
  parsed.command = args._.shift() || null

  // Parse remaining arguments.
  for (var key in args) {
    if (!Array.isArray(args[key]))
      args[key] = [ args[key] ]
    for (var i in args[key]) {
      switch (key) {
        
        case '_':
          parsed.args['_'].push(args[key][i])
          break

        // -c | --config  Path to configuration file
        case 'c':
        case 'config':
          parsed.args['config'] = args[key][i]
          parsed.path['user'] = path.resolve(args[key][i])
          parsed.path['config'] = path.resolve(path.join(args[key][i], 'config.yaml'))
          parsed.path['state'] = path.resolve(path.join(args[key][i], 'state.yaml'))
          parsed.path['env'] = path.resolve(path.join(args[key][i], '.env'))
          break

        // -i | --indented  Indent logged objects
        case 'i':
        case 'indented':
          parsed.args['indented'] = true
          break

        // -L | --log-level  Minimum log-level to show in the console
        case 'L':
        case 'log-level':
          const value = (args[key][i].toString() || '').toLowerCase()
          if (![ 'debug', 'info', 'warn', 'error' ].includes(value))
            throw new Error('--log-level must be one of: debug, info, warn, error')
          parsed.args['log-level'] = value
          break

        // -v | --verbose  Display timestamps and log levels with each log line
        case 'v':
        case 'verbose':
          parsed.args['verbose'] = true
          break

        // -a | --app | --application  Application under ./apps
        case 'a':
        case 'app':
        case 'application':
          parsed.args['app'] = true
          break

        // -k | --k8s | --kubernetes  Kubernetes plugin
        case 'k':
        case 'k8s':
        case 'kubernetes':
          parsed.args['kubernetes'] = true
          break

        // -o | --obs | --observability  Observability plugin
        case 'o':
        case 'obs':
        case 'observability':
          parsed.args['observability'] = true
          break

        // -l | --alerts  Alerts plugin
        case 'l':
        case 'alerts':
          parsed.args['alerts'] = true
          break

        // --all  Used by the apps and plugins commands
        case 'all':
          parsed.args['all'] = true
          break
      }
    }
  }
  for (var key in parsed)
    context.set(key, parsed[key])
}

// Export default
module.exports = {
  parse: parse
}
