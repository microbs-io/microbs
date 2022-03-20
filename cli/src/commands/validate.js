// Standard packages
const fs = require('fs')
const path = require('path')

// Third-party packages
const hasbin = require('hasbin')
const semver = require('semver')

// Main packages
const config = require('../config')
const context = require('../context')
const utils = require('../utils')

/**
 * Validate Node.js version
 */
const validateNodeVersion = () => {
  const nvmrcFilepath = path.resolve(context.get('homepath'), '.nvmrc')
  if (fs.existsSync(nvmrcFilepath)) {
    const versionRequired = semver.clean(fs.readFileSync(nvmrcFilepath).toString())
    const versionActual = semver.clean(semver.clean(process.version))
    if (semver.gte(versionActual, versionRequired))
      console.info(`... node is correct version [using=${versionActual}, required>=${versionRequired}]`)
    else
      console.warn(`... node is incorrect version [using=${versionActual}, required>=${versionRequired}]`)
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
        console.warn(`... kubectl is incorrect version [using=${versionActual}, required>=${versionRequired}]`)
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
        console.warn(`... skaffold is incorrect version [using=${versionActual}, required>=${versionRequired}]`)
    } catch (e) {
      console.error(e)
    }
  }
}

/**
 * Validate the existence of the given config file.
 */
const validateConfigExists = () => {
  try {
    config.read()
    console.info(`... config file exists: ${context.get('filepath')}`)
  } catch (e) {
    console.warn(e)
  }
}

/**
 * Validate the syntax of the config file.
 */
const validateConfigSyntax = () => {
  try {
    config.parse(config.read())
    console.info('... config file can be parsed.')
  } catch (e) {
    if (e.name == 'YAMLException') {
      console.error('... config file cannot be parsed:')
      console.error('')
      console.error(e.reason)
      console.error('')
      console.error(e.mark.snippet)
      console.error('')
    } else {
      console.error(e)
    }
  }
}

/**
 * Validate the fields and values of the given config file.
 */
const validateConfigValues = () => {
  try {
    config.init()
  } catch (e) {
    console.warn(e)
  }
  var hasErrors = false

  // Validate required fields
  const requiredAlways = [
    'deployment.name',
    'deployment.plugins.k8s',
  ]
  for (var i in requiredAlways) {
    if (!config.get(requiredAlways[i])) {
      hasErrors = true
      console.error(`... '${requiredAlways[i]}' is required but missing from config.`)
    }
  }

  // Validate normally required fields
  const requiredNormally = [
    'deployment.app',
    'deployment.plugins.obs',
    'otlp.receiver.host',
    'otlp.receiver.port',
  ]
  for (var i in requiredNormally) {
    if (!config.get(requiredNormally[i])) {
      hasErrors = true
      console.error(`... '${requiredNormally[i]}' is required but missing from config.`)
    }
  }

  // Validate specific values
  const pluginTypes = [ 'alerts', 'k8s', 'obs' ]
  for (var i in pluginTypes) {
    const pluginName = config.get(`deployment.plugins.${pluginTypes[i]}`)
    if (pluginName) {
      const pluginsInstalled = Object.keys(require('../plugins')[pluginTypes[i]])
      if (!pluginsInstalled.includes(pluginName)) {
        hasErrors = true
        console.error(`... 'deployment.plugins.${pluginTypes[i]}' does not name an installed plugin: ${pluginName}`)
      }
    }
  }
  if (config.get('otlp.receiver.port')) {
    if (!config.get('otlp.receiver.port').toString().match(/^[0-9]+$/)) {
      hasErrors = true
      console.error(`... 'otlp.receiver.port' expected an integer but found: ${config.get('otlp.receiver.port')}`)
    }
  }

  if (!hasErrors)
    console.info('... no problems detected in config file.')
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

const validateConfig = () => {
  console.log('')
  console.log('Validating config...')
  validateConfigExists()
  validateConfigSyntax()
  validateConfigValues()
}

const validatePlugins = async () => {
  console.log('')
  console.log('Validating plugins...')
  const pluginTypes = [ 'alerts', 'k8s', 'obs' ]
  for (var i in pluginTypes) {
    const pluginName = config.get(`deployment.plugins.${pluginTypes[i]}`)
    var plugin = require('../plugins')[pluginTypes[i]][pluginName]
    if (plugin) {
      if (plugin.validate) {
        await plugin.validate()
      } else {
        console.debug(`... the '${pluginName}' ${pluginTypes[i]} plugin does not implement the 'validate' command.`)
      }
    } else {
      console.debug(`... no ${pluginTypes[i]} plugin was defined in the config file.`)
    }
  }
}

/**
 * Validate microbs installation and configuration.
 */
module.exports.run = async () => {
  validateDependencies()
  validateConfig()
  await validatePlugins()
}
