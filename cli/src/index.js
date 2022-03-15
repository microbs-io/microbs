/*
 * index.js
 *
 * Main entrypoint for the microbs command-line interface (CLI).
 */

// Standard packages
const crypto = require('crypto')
const path = require('path')

// Third-party packages
const chalk = require('chalk')
const glob = require('glob')

// Main packages
const config = require('./config')
const plugins = require('./plugins')
const rollout = require('./rollout')
const state = require('./state')
const validate = require('./validate')

// Help doc
const __doc = `

${chalk.bold.cyanBright('microbs - microservices observability')}

Usage: ${chalk.cyan('microbs COMMAND [options]')}

  ${chalk.cyan('microbs setup')}      Setup all or some of the configured deployment
    [-c|--config]    Path to config file (default: ./config.yaml)
    [-k|--k8s]       Setup the Kubernetes cluster
    [-o|--obs]       Setup the observability solution
    [-a|--app]       Deploy the application services
    [-l|--alerts]    Setup the alerts channel

  ${chalk.cyan('microbs destroy')}    Destroy all or some of the configured deployment
    [-c|--config]    Path to config file (default: ./config.yaml)
    [-k|--k8s]       Destroy the Kubernetes cluster
    [-o|--obs]       Destroy the observability solution
    [-a|--app]       Remove the application services
    [-l|--alerts]    Destroy the alerts channel

  ${chalk.cyan('microbs rollout')}    Rollout a variant of a deployed application
    [VARIANT_NAME]   Name of the variant to rollout
    [-c|--config]    Path to config file (default: ./config.yaml)

  ${chalk.cyan('microbs stabilize')}  Revert a deployed application to its stable scenario
    [-c|--config]    Path to config file (default: ./config.yaml)

  ${chalk.cyan('microbs apps')}       List all deployable applications
  ${chalk.cyan('microbs plugins')}    List all available plugins
  ${chalk.cyan('microbs validate')}   Validate microbs installation and config
  ${chalk.cyan('microbs help')}       Display this help screen

${chalk.dim(`
microbs is an open source, vendor-inclusive framework to demo, test, or learn
about microservices observability.

Learn more: https://microbs.io
Contribute: https://github.com/microbs-io/microbs`)}

`

/**
 * Display the help doc.
 */
const runHelp = () => console.log(__doc)

/**
 * Rollout the "main" skaffold profile to a deployed application.
 */
const runStabilize = async (opts) => {
  var opts = opts || {}
  if (!opts.profile)
    opts.profile = 'main'
  return await runRollout(opts)
}

/**
 * Rollout a skaffold profile (i.e. "variant") to a deployed application.
 */
const runRollout = async (opts) => {
  const command = config.get('_context.command')
  const args = config.get('_context.args')

  // Validate the command.
  var opts = opts || {}
  if (command === 'rollout' && args._.length > 1)
    throw new Error('`microbs rollout` requires zero or one variant names.')
  if (command === 'rollout' && args._.length === 1)
    opts.profile = args._[0]
  else if (!opts.profile)
    opts.profile = 'main'

  // Set the application version to a random value. This new version will only
  // apply to the services that have changed since the prior variant.
  state.set('deployment.version', crypto.randomBytes(4).toString('hex'))
  state.save()

  // Determine which plugins(s) to invoke for this command.
  const all = (!args.alerts && !args.app && !args.k8s && !args.obs)
  const pluginTypes = [ 'k8s', 'obs', 'alerts' ]

  // Invoke the 'rollout' command for each given plugin that implements it.
  for (var i in pluginTypes) {
    let pluginType = pluginTypes[i]
    if (all || args[pluginType]) {
      var pluginName = config.get(`deployment.plugins.${pluginType}`)
      var plugin = plugins[pluginType][pluginName]
      if (plugin) {
        if (plugin.rollout) {
          await plugin.rollout(opts)
        } else {
          console.debug(`The '${pluginName}' ${pluginType} plugin does not implement the 'rollout' command.`)
        }
      } else {
        console.debug(`No ${pluginType} plugin was defined in the config file.`)
      }
    }
  }

  // Rollout the application services, if given.
  if (all || args.app) {
    console.log('')
    console.log(`Starting services for the '${config.get('deployment.app')}' application on Kubernetes...`)
    opts.skaffoldFilepath = path.join(__dirname, '..', '..', 'apps', config.get('deployment.app'), 'skaffold.yaml')
    await rollout(opts)
  }
}

/**
 * Run the destroy command(s) of the given plugin(s).
 * Start with the application services, then the observability solution,
 * then the Kubernetes cluster.
 */
const runDestroy = async () => {
  const args = config.get('_context.args')

  // Determine which plugins(s) to invoke for this command.
  const all = (!args.alerts && !args.app && !args.k8s && !args.obs)

  // Remove the application services, if given.
  if (all || args.app)
    await runRollout({ action: 'delete' })

  // Invoke the 'destroy' command for each plugin that implements it.
  const pluginTypes = [ 'alerts', 'obs', 'k8s' ]
  for (var i in pluginTypes) {
    let pluginType = pluginTypes[i]
    if (all || args[pluginType]) {
      var pluginName = config.get(`deployment.plugins.${pluginType}`)
      var plugin = plugins[pluginType][pluginName]
      if (plugin) {
        if (plugin.destroy) {
          await plugin.destroy()
        } else {
          console.debug(`The '${pluginName}' ${pluginType} plugin does not implement the 'destroy' command.`)
        }
      } else {
        console.debug(`No ${pluginType} plugin was defined in the config file.`)
      }
    }
  }
}

/**
 * Run the setup command(s) of the given plugin(s).
 * Start with the Kubernetes cluster, then the observability solution,
 * then the application services.
 */
const runSetup = async () => {
  const args = config.get('_context.args')

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
          console.debug(`The '${pluginName}' ${pluginType} plugin does not implement the 'setup' command.`)
        }
      } else {
        console.debug(`No ${pluginType} plugin was defined in the config file.`)
      }
    }
  }

  // Rollout the application services for the 'main' profile, if applicable.
  if (all || args.app)
    await runRollout({ profile: 'main' })
}

/**
 * List all deployable apps.
 */
const runApps = () => {
  console.log('')
  console.log('apps:')
  glob.sync(path.join(__dirname, '..', '..', 'apps', '*/')).forEach((filepath) => {
    console.log(`  - ${path.basename(filepath)}`)
  })
  console.log('')
}

/**
 * List all available plugins.
 */
const runPlugins = () => {
  console.log('')
  console.log('alerts:')
  for (var plugin in plugins.alerts)
    console.log(`  - ${plugin}`)
  console.log('')
  console.log('k8s:')
  for (var plugin in plugins.k8s)
    console.log(`  - ${plugin}`)
  console.log('')
  console.log('observability:')
  for (var plugin in plugins.obs)
    console.log(`  - ${plugin}`)
  console.log('')
}

/**
 * Validate the installation and configuration of microbs.
 */
const runValidate = () => {
  return validate.run()
}

/**
 * Run a command.
 */
module.exports.run = async () => {
  switch (config.get('_context.command')) {
    case 'setup':
      config.load()
      return await runSetup()
    case 'rollout':
      config.load()
      return await runRollout()
    case 'stabilize':
      config.load()
      return await runStabilize()
    case 'destroy':
      config.load()
      return await runDestroy()
    case 'apps':
      config.load()
      return runApps()
    case 'plugins':
      config.load()
      return runPlugins()
    case 'validate':
      return runValidate() // Don't load config until needed by validate.run()
    default:
      return runHelp()     // Don't load config
  }
}

if (require.main === module)
  module.exports.run()
