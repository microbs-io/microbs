/*
 * validate.js
 */

// Third-party packages
const hasbin = require('hasbin')
const semver = require('semver')

// Main packages
const utils = require('../../../utils')

/**
 * Validate minikube installation
 */
const validateMinikubeInstallation = () => {
  if(hasbin.sync('minikube'))
    console.info('... minikube is installed')
  else
    console.warn('... minikube is not installed')
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
        console.info(`... minikube is correct version [using=${versionActual}, required>=${versionRequired}]`)
      else
        console.warn(`... minikube is incorrect version [using=${versionActual}, required>=${versionRequired}]`)
    } catch (e) {
      console.error(e)
    }
  } else {
    console.warn(result.stderr)
  }
}

module.exports = async () => {
  validateMinikubeInstallation()
  validateMinikubeVersion()
}
