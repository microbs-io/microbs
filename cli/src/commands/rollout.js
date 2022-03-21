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
const logger = require('../logger')
const state = require('../state')
const utils = require('../utils')

const validate = (opts) => {
  if (!opts.action == 'run' && !opts.action == 'delete')
    throw new Error('opts.action must be either "run" or "delete"')
  if (!opts.skaffoldFilepath)
    throw new Error('opts.skaffoldFilepath must be given')
}

module.exports.rollout = async (opts) => {
  var opts = opts || {}
  if (!opts.action)
    opts.action = 'run'
  if (!opts.namespace)
    opts.namespace = 'default'
  if (!opts.profile)
    opts.profile = 'main'
  validate(opts)

  // Recreate microbs-secrets
  logger.info('')
  logger.info('Recreating microbs-secrets on Kubernetes...')
  logger.debug('...removing old microbs-secrets from Kubernetes...')
  utils.exec(`kubectl delete secret microbs-secrets --namespace=${quote([ opts.namespace ])}`, true)

  // Save .state
  state.save()

  // Turn .state into .env for microbs-secrets
  logger.debug(`...staging new microbs-secrets at ${process.cwd()}/.env`)
  const envFilepath = `${process.cwd()}/.env`
  utils.createEnvFile(state.get(), envFilepath)

  logger.debug('...deploying new microbs-secrets to Kubernetes...')
  utils.exec(`kubectl create secret generic microbs-secrets --from-env-file='${quote([ envFilepath ])}' --namespace=${quote([ opts.namespace ])}`, true)
  logger.info('...done.')

  logger.info('')
  logger.info(`Rolling out the '${opts.profile}' profile with skaffold...`)
  logger.info('')
  var command = `skaffold ${quote([ opts.action ])} -p "${quote([ opts.profile ])}" -f "${quote([ opts.skaffoldFilepath ])}"`
  if (opts.action == 'run')
    command = `${command} -l "skaffold.dev/run-id=microbs-${quote([ config.get('deployment.name') ])}"`
  if (config.get('docker.registry'))
    command = `${command} --default-repo="${quote([ config.get('docker.registry') ])}"`
  utils.exec(command)

  logger.info('')
  logger.info('Rollout complete.')
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

  // Rollout the application services, if given.
  logger.info('')
  logger.info(`Starting services for the '${config.get('deployment.app')}' application on Kubernetes...`)
  opts.skaffoldFilepath = path.join(context.get('homepath'), 'apps', config.get('deployment.app'), 'skaffold.yaml')
  await module.exports.rollout(opts)
}
