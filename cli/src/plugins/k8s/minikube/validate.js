/*
 * validate.js
 */

// Third-party packages
const hasbin = require('hasbin')
const semver = require('semver')

// Main packages
const logger = require('../../../logger')
const utils = require('../../../utils')
const validate = require('../../../commands/validate')

/**
 * Validate minikube installation
 */
const validateMinikubeInstallation = () => {
  if(hasbin.sync('minikube'))
    validate.logSuccess('minikube is installed')
  else
    validate.logFailure('minikube is not installed')
}

/**
 * Validate minikube version
*/
const validateMinikubeVersion = () => {
  const result = utils.exec('minikube version', true)
  if (result.stdout) {
    try {
      versionActual = semver.clean(result.stdout.match(/minikube version: v(.+)/)[1])
      versionRequired = semver.clean('1.25.2')
      if (semver.gte(versionActual, versionRequired))
        validate.logSuccess(`minikube is correct version [using=${versionActual}, required>=${versionRequired}]`)
      else
        validate.logFailure(`minikube is incorrect version [using=${versionActual}, required>=${versionRequired}]`)
    } catch (e) {
      logger.error(e)
    }
  } else {
    logger.warn(result.stderr)
  }
}

module.exports = async () => {
  validateMinikubeInstallation()
  validateMinikubeVersion()
}
