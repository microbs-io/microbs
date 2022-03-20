/*
 * rollout.js
 *
 * Rollout a skaffold profile (i.e. "scenario") to a deployed application.
 */

// Standard packages
const crypto = require('crypto')
const path = require('path')

// Third-party packages
const quote = require('shell-quote').quote

// Main packages
const config = require('../config')
const context = require('../context')
const plugins = require('../plugins')
const state = require('../state')
const utils = require('../utils')

const validate = (opts) => {
  if (!opts.action == 'run' && !opts.action == 'delete')
    throw new Error('opts.action must be either "run" or "delete"')
  if (!opts.skaffoldFilepath)
    throw new Error('opts.skaffoldFilepath must be given')
}

const rollout = async (opts) => {
  var opts = opts || {}
  if (!opts.action)
    opts.action = 'run'
  if (!opts.namespace)
    opts.namespace = 'default'
  if (!opts.profile)
    opts.profile = 'main'
  validate(opts)

  // Recreate microbs-secrets
  console.log('')
  console.log('Recreating microbs-secrets on Kubernetes...')
  console.debug('...removing old microbs-secrets from Kubernetes...')
  utils.exec(`kubectl delete secret microbs-secrets --namespace=${quote([ opts.namespace ])}`, true)

  // Save .state
  state.save()

  // Turn .state into .env for microbs-secrets
  console.debug(`...staging new microbs-secrets at ${process.cwd()}/.env`)
  const envFilepath = `${process.cwd()}/.env`
  utils.createEnvFile(state.get(), envFilepath)

  //console.debug('')
  console.debug('...deploying new microbs-secrets to Kubernetes...')
  utils.exec(`kubectl create secret generic microbs-secrets --from-env-file='${quote([ envFilepath ])}' --namespace=${quote([ opts.namespace ])}`, true)
  console.log('...done.')

  console.log('')
  console.log(`Rolling out the '${opts.profile}' profile with skaffold...`)
  console.log('')
  var command = `skaffold ${quote([ opts.action ])} -p "${quote([ opts.profile ])}" -f "${quote([ opts.skaffoldFilepath ])}"`
  if (opts.action == 'run')
    command = `${command} -l "skaffold.dev/run-id=microbs-${quote([ config.get('deployment.name') ])}"`
  if (config.get('docker.registry'))
    command = `${command} --default-repo="${quote([ config.get('docker.registry') ])}"`
  utils.exec(command)

  console.log('')
  console.log('Rollout complete.')
}

/**
 * Rollout a skaffold profile (i.e. "variant") to a deployed application.
 */
module.exports.run = async (opts) => {
  const command = context.get('command')
  const args = context.get('args')

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
    opts.skaffoldFilepath = path.join(context.get('homepath'), 'apps', config.get('deployment.app'), 'skaffold.yaml')
    await rollout(opts)
  }
}
