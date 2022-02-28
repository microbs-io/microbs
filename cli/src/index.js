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

// Help doc
const __doc = `

${chalk.bold.cyanBright('microbs - microservices observability')}

Usage: ${chalk.cyan('microbs COMMAND [options]')}

  ${chalk.cyan('microbs setup')}      Setup all or some of the configured deployment.
    [-c|--config]      Path to configuration file (config.yaml).
    [-k|--k8s]         Setup the Kubernetes cluster.
    [-o|--obs]         Setup the observability solution.
    [-a|--app]         Deploy the application services.

  ${chalk.cyan('microbs destroy')}    Destroy all or some of the configured deployment.
    [-c|--config]      Path to configuration file (config.yaml).
    [-a|--app]         Remove the application services.
    [-o|--obs]         Destroy the observability solution.
    [-k|--k8s]         Destroy the Kubernetes cluster.

  ${chalk.cyan('microbs rollout')}    Rollout a variant of a deployed application.
    [VARIANT_NAME]     Name of the variant to rollout.
    [-c|--config]      Path to configuration file (config.yaml).

  ${chalk.cyan('microbs stabilize')}  Revert a deployed application to its stable scenario.
    [-c|--config]      Path to configuration file (config.yaml).

  ${chalk.cyan('microbs apps')}       List all deployable applications.
  ${chalk.cyan('microbs plugins')}    List all available plugins.
  ${chalk.cyan('microbs help')}       Display this help screen.

${chalk.dim(`
microbs is an open source, vendor-inclusive framework to test, learn, and
demonstrate observability of microservices on Kubernetes.

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

  // Determine which command(s) to run.
  const all = (!args.app && !args.k8s && !args.obs)

  // Run the rollout command of the k8s plugin, if given and applicable.
  if (all || args.k8s)
    if (plugins.k8s[config.get('deployment.plugins.k8s')].rollout)
      await plugins.k8s[config.get('deployment.plugins.k8s')].rollout(opts)

  // Run the rollout command of the observability plugin, if given and applicable.
  if (all || args.obs)
    if (plugins.obs[config.get('deployment.plugins.obs')].rollout)
      await plugins.obs[config.get('deployment.plugins.obs')].rollout(opts)

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

  // Determine which command(s) to run.
  const args = config.get('_context.args')
  const all = (!args.app && !args.k8s && !args.obs)

  // Remove the application services, if given.
  if (all || args.app)
    await runRollout({ action: 'delete' })

  // Run the destroy command of the observability plugin, if given.
  if (all || args.obs)
    await plugins.obs[config.get('deployment.plugins.obs')].destroy()

  // Run the destroy command of the k8s plugin, if given.
  if (all || args.k8s)
    await plugins.k8s[config.get('deployment.plugins.k8s')].destroy()
}

/**
 * Run the setup command(s) of the given plugin(s).
 * Start with the Kubernetes cluster, then the observability solution,
 * then the application services.
 */
const runSetup = async () => {

  // Determine which command(s) to run.
  const args = config.get('_context.args')
  const all = (!args.app && !args.k8s && !args.obs)

  // Run the setup command of the k8s plugin, if given.
  if (all || args.k8s)
    await plugins.k8s[config.get('deployment.plugins.k8s')].setup()

  // Run the setup command of the observability plugin, if given.
  if (all || args.obs)
    await plugins.obs[config.get('deployment.plugins.obs')].setup()

  // Rollout the main profile.
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
 * Run a command.
 */
module.exports.run = async () => {
  switch (config.get('_context.command')) {
    case 'setup':
      return await runSetup()
    case 'rollout':
      return await runRollout()
    case 'stabilize':
      return await runStabilize()
    case 'destroy':
      return await runDestroy()
    case 'apps':
      return runApps()
    case 'plugins':
      return runPlugins()
    default:
      return runHelp()
  }
}

if (require.main === module)
  module.exports.run()
