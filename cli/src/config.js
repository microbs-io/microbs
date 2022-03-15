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

// Global configuration object
const config = {}

// Default command context.
// _context is made available to the CLI but is not saved to .state.
config._context = {
  homepath: path.join(process.cwd()),
  filepath: path.join(process.cwd(), 'config.yaml'),
  command: 'help',
  args: { _: [] }
}

// Parse command-line arguments.
const args = parseArgs(process.argv.slice(2))
config._context.command = args._.shift()
for (var key in args) {
  if (!Array.isArray(args[key]))
    args[key] = [ args[key] ]
  for (var i in args[key]) {
    switch (key) {

      case '_':
        config._context.args._.push(args[key][i])
        break

      // -c | --config  Path to configuration file
      case 'c':
      case 'config':
        config._context.filepath = args[key][i]
        break

      // -a | --app  Application under ./apps
      case 'a':
      case 'app':
        config._context.args.app = true
        break

      // -k | --k8s  Kubernetes plugin under ./cli/src/plugins/k8s
      case 'k':
      case 'k8s':
        config._context.args.k8s = true
        break

      // -l | --alerts  Alerts plugin under ./cli/src/plugins/alerts
      case 'l':
      case 'alerts':
        config._context.args.alerts = true
        break

      // -o | --obs  Observability plugin under ./cli/src/plugins/obs
      case 'o':
      case 'obs':
        config._context.args.obs = true
        break
    }
  }
}

/**
 * Read config file.
 */
const read = () => {
  try {
    return fs.readFileSync(config._context.filepath, 'utf8')
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`No configuration file at specified path: ${config._context.filepath}`)
      process.exit(1)
    } else {
      throw err
    }
  }
}

/**
 * Parse the contents of a config file to a YAML object, and then flatten the
 * structure of the object.
 */
const parse = (contents) => utils.flatten(yaml.load(contents || {}))

/**
 * Load the config file and persist it as the global config object.
 * Clear any existing config except for the command context.
 */
const load = () => {
  for (var key in Object.keys(config))
    if (key != '_context')
      delete config[key]
  for (var [ key, value ] of Object.entries(parse(read())))
    if (key != '_context')
      config[key] = value
}

/**
 * Get a value from the config object at a given path (i.e. dotted key),
 * or get the entire config object if no path is given.
 */
const get = (path) => path ? _.get(config, path) : config

// Export final config
module.exports = {
  read: read,
  parse: parse,
  load: load,
  get: get
}
