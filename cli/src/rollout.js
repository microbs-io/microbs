/*
 * rollout.js
 *
 * Rollout a skaffold profile (i.e. "scenario") to a deployed application.
 */

// Third-party packages
const quote = require('shell-quote').quote

// Main packages
const config = require('./config.js')
const state = require('./state.js')
const utils = require('./utils.js')

const validate = (opts) => {
  if (!opts.action == 'run' && !opts.action == 'delete')
    throw new Error('opts.action must be either "run" or "delete"')
  if (!opts.skaffoldFilepath)
    throw new Error('opts.skaffoldFilepath must be given')
}

module.exports = async (opts) => {
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

  // Merge config.yaml into .state
  state.merge(config.get())
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
