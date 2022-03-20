/*
 * validate.js
 */

// Third-party packages
const hasbin = require('hasbin')
const semver = require('semver')

// Main packages
const utils = require('../../../utils.js')

/**
 * Validate kind installation
 */
const validateKindInstallation = () => {
  if(hasbin.sync('kind'))
    console.info('... kind is installed')
  else
    console.warn('... kind is not installed')
}

/**
 * Validate kind version
*/
const validateKindVersion = () => {
  const result = utils.exec('kind version', true)
  if (result.stdout) {
    try {
      versionActual = semver.clean(result.stdout.match(/kind v([^ ]+) /)[1])
      versionRequired = semver.clean('0.12.0')
      if (semver.gte(versionActual, versionRequired))
        console.info(`... kind is correct version [using=${versionActual}, required>=${versionRequired}]`)
      else
        console.warn(`... kind is incorrect version [using=${versionActual}, required>=${versionRequired}]`)
    } catch (e) {
      console.error(e)
    }
  } else {
    console.warn(result.stderr)
  }
}

module.exports = async () => {
  validateKindInstallation()
  validateKindVersion()
}
