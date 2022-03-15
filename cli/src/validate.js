// Standard packages
const fs = require('fs')
const path = require('path')

// Third-party packages
const hasbin = require('hasbin')
const semver = require('semver')

// Main packages
const utils = require('./utils')

/**
 * Validate Node.js version
 */
const validateNodeVersion = () => {
  const nvmrcFilepath = path.resolve(__dirname, '..', '..', '.nvmrc')
  if (fs.existsSync(nvmrcFilepath)) {
    const versionRequired = semver.clean(fs.readFileSync(nvmrcFilepath).toString())
    const versionActual = semver.clean(semver.clean(process.version))
    if (semver.gte(versionActual, versionRequired))
      console.info(`... node is correct version [using=${versionActual}, required>=${versionRequired}]`)
    else
      console.warn('... node is incorrect version.')
  } else {
    console.warn('... could not find .nvmrc to determine the required version of node.')
  }
}

/**
 * Validate kubectl installation
 */
const validateKubectlInstallation = () => {
  if(hasbin.sync('kubectl'))
    console.info('... kubectl is installed')
  else
    console.warn('... kubectl is not installed')
}

/**
 * Validate kubectl version
 */
const validateKubectlVersion = () => {
  const result = utils.exec('kubectl version --client', true)
  if (result.stdout) {
    try {
      versionActual = semver.clean(result.stdout.match(/GitVersion:"v([^"]+)"/)[1])
      versionRequired = semver.clean('1.23.4')
      if (semver.gte(versionActual, versionRequired))
        console.info(`... kubectl is correct version [using=${versionActual}, required>=${versionRequired}]`)
      else
        console.warn('... kubectl is incorrect version.')
    } catch (e) {
      console.error(e)
    }
  } else {
    console.warn(result.stderr)
  }
}

/**
 * Validate skaffold installation
 */
const validateSkaffoldInstallation = () => {
  if(hasbin.sync('skaffold'))
    console.info('... skaffold is installed')
  else
    console.warn('... skaffold is not installed')
}

/**
 * Validate skaffold version
 */
const validateSkaffoldVersion = () => {
  const result = utils.exec('skaffold version', true)
  if (result.stdout) {
    try {
      versionActual = semver.clean(result.stdout)
      versionRequired = semver.clean('1.36.0')
      if (semver.gte(versionActual, versionRequired))
        console.info(`... skaffold is correct version [using=${versionActual}, required>=${versionRequired}]`)
      else
        console.warn('... skaffold is incorrect version.')
    } catch (e) {
      console.error(e)
    }
  }
}

/**
 * Validate software dependencies of microbs.
 */
const validateDependencies = () => {
  console.log('')
  console.log('Validating dependencies...')
  validateNodeVersion()
  validateKubectlInstallation()
  validateKubectlVersion()
  validateSkaffoldInstallation()
  validateSkaffoldVersion()
}

/**
 *
 */
module.exports.run = () => {
  validateDependencies()
  // TODO: Validate existence of config.yaml
  // TODO: Validate syntax of config.yaml
  // TODO: Validate fields and values of config.yaml
  // TODO: Validate plugin configurations
}
