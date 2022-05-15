/*
 * rollout.js
 *
 * Rollout a skaffold profile (i.e. "scenario") to a deployed application.
 */

// Standard packages
const crypto = require('crypto')
const path = require('path')

// Main packages
const { config, context, logger, rollout, state } = require('@microbs.io/core')

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
  
  // Invoke any before_rollout hooks
  const hooks = require('../hooks')
  await hooks.run('before_rollout')

  // Set the application version to a random value. This new version will only
  // apply to the services that have changed since the prior variant.
  state.set('deployment.version', crypto.randomBytes(4).toString('hex'))
  state.save()

  // Rollout the application services, if given.
  logger.info('')
  logger.info(`Starting services for the '${config.get('deployment.app')}' application on Kubernetes...`)
  opts.skaffoldFilepath = path.join(context.get('path.app'), 'src', 'skaffold.yaml')
  await rollout.run(opts)
  
  // Invoke any after_rollout hooks
  await hooks.run('after_rollout')
}
