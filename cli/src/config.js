/*
 * config.js
 *
 * Parses the config.yaml configuration file and makes it available to the CLI.
 */

// Standard packages
const fs = require('fs')
const path = require('path')
const process = require('process')

// Third-party packages
const _ = require('lodash')
const parseArgs = require('minimist')
const yaml = require('js-yaml')

// Main packages
const utils = require('./utils')

// Default command context.
// _context is made available to the CLI but is not saved to .state.
const _context = {
  homepath: path.join(process.cwd()),
  filepath: path.join(process.cwd(), 'config.yaml'),
  command: 'help',
  args: { _: [] }
}

// Parse command-line arguments.
const args = parseArgs(process.argv.slice(2))
_context.command = args._.shift()
for (var key in args) {
  if (!Array.isArray(args[key]))
    args[key] = [ args[key] ]
  for (var i in args[key]) {
    switch (key) {

      case '_':
        _context.args._.push(args[key][i])
        break

      // -c | --config  Path to configuration file
      case 'c':
      case 'config':
        _context.filepath = args[key][i]
        break

      // -a | --app  Application under ./apps
      case 'a':
      case 'app':
        _context.args.app = true
        break

      // -k | --k8s  Kubernetes plugin under ./cli/src/plugins/k8s
      case 'k':
      case 'k8s':
        _context.args.k8s = true
        break

      // -o | --obs  Observability plugin under ./cli/src/plugins/obs
      case 'o':
      case 'obs':
        _context.args.obs = true
        break
    }
  }
}

// Get config file
var configFile
try {
  configFile = fs.readFileSync(_context.filepath, 'utf8')
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error('No configuration file at specified path: ' + _context.filepath)
    process.exit(1)
  } else {
    throw err
  }
}

// Parse config file and merge command-line context
const config = utils.flatten(yaml.load(configFile || {}))
config._context = _context

// Export final config
module.exports = {
  get: (path) => path ? _.get(config, path) : config
}
