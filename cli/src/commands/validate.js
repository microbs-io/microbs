// Standard packages
const fs = require('fs')
const path = require('path')

// Third-party packages
const chalk = require('chalk')
const hasbin = require('hasbin')
const semver = require('semver')

// Main packages
const config = require('../config')
const context = require('../context')
const logger = require('../logger')
const utils = require('../utils')

const logSuccess = (msg) => logger.info(`${chalk.bold.green('✓')} ${chalk.dim(msg)}`)
const logFailure = (msg) => logger.error(`${chalk.bold.red('⨯')} ${msg}`)
const logUnknown = (msg) => logger.warn(`${chalk.bold.yellow('?')} ${msg}`)
module.exports.logSuccess = logSuccess
module.exports.logFailure = logFailure
module.exports.logUnknown = logUnknown

/**
 * Validate Node.js version
 */
const validateNodeVersion = () => {
  const nvmrcFilepath = path.resolve(context.get('homepath'), '.nvmrc')
  if (fs.existsSync(nvmrcFilepath)) {
    const versionRequired = semver.clean(fs.readFileSync(nvmrcFilepath).toString())
    const versionActual = semver.clean(semver.clean(process.version))
    if (semver.gte(versionActual, versionRequired))
      logSuccess(`node is correct version [using=${versionActual}, required>=${versionRequired}]`)
    else
      logFailure(`node is incorrect version [using=${versionActual}, required>=${versionRequired}]`)
  } else {
    logUnknown(`could not find .nvmrc to determine the required version of node.`)
  }
}

/**
 * Validate kubectl installation
 */
const validateKubectlInstallation = () => {
  if(hasbin.sync('kubectl'))
    logSuccess('kubectl is installed')
  else
    logFailure('kubectl is not installed')
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
        logSuccess(`kubectl is correct version [using=${versionActual}, required>=${versionRequired}]`)
      else
        logFailure(`kubectl is incorrect version [using=${versionActual}, required>=${versionRequired}]`)
    } catch (e) {
      logger.error(e)
    }
  } else {
    logger.warn(result.stderr)
  }
}

/**
 * Validate skaffold installation
 */
const validateSkaffoldInstallation = () => {
  if(hasbin.sync('skaffold'))
    logSuccess('skaffold is installed')
  else
    logFailure('skaffold is not installed')
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
        logSuccess(`skaffold is correct version [using=${versionActual}, required>=${versionRequired}]`)
      else
        logFailure(`skaffold is incorrect version [using=${versionActual}, required>=${versionRequired}]`)
    } catch (e) {
      logger.error(e)
    }
  }
}

/**
 * Validate the existence of the given config file.
 */
const validateConfigExists = () => {
  try {
    config.read()
    logSuccess(`config file exists: ${context.get('filepath')}`)
  } catch (e) {
    logger.warn(e)
  }
}

/**
 * Validate the syntax of the config file.
 */
const validateConfigSyntax = () => {
  try {
    config.parse(config.read())
    logSuccess('config file can be parsed.')
  } catch (e) {
    if (e.name == 'YAMLException') {
      logFailure('config file cannot be parsed:')
      logger.error('')
      logger.error(e.reason)
      logger.error('')
      logger.error(e.mark.snippet)
      logger.error('')
    } else {
      logger.error(e)
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
    logger.warn(e)
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
      logger.error(`... '${requiredAlways[i]}' is required but missing from config.`)
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
      logFailure(`'${requiredNormally[i]}' is required but missing from config.`)
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
        logFailure(`'deployment.plugins.${pluginTypes[i]}' does not name an installed plugin: ${pluginName}`)
      }
    }
  }
  if (config.get('otlp.receiver.port')) {
    if (!config.get('otlp.receiver.port').toString().match(/^[0-9]+$/)) {
      hasErrors = true
      logFailure(`'otlp.receiver.port' expected an integer but found: ${config.get('otlp.receiver.port')}`)
    }
  }

  if (!hasErrors)
    logSuccess('no problems detected in config file.')
}

/**
 * Validate software dependencies of microbs.
 */
const validateDependencies = () => {
  logger.info('')
  logger.info('Validating dependencies...')
  validateNodeVersion()
  validateKubectlInstallation()
  validateKubectlVersion()
  validateSkaffoldInstallation()
  validateSkaffoldVersion()
}

const validateConfig = () => {
  logger.info('')
  logger.info('Validating config...')
  validateConfigExists()
  validateConfigSyntax()
  validateConfigValues()
}

const validatePlugins = async () => {
  logger.info('')
  logger.info('Validating plugins...')
  const pluginTypes = [ 'alerts', 'k8s', 'obs' ]
  for (var i in pluginTypes) {
    const pluginName = config.get(`deployment.plugins.${pluginTypes[i]}`)
    var plugin = require('../plugins')[pluginTypes[i]][pluginName]
    if (plugin) {
      if (plugin.validate) {
        await plugin.validate()
      } else {
        logger.debug(`... the '${pluginName}' ${pluginTypes[i]} plugin does not implement the 'validate' command.`)
      }
    } else {
      logger.debug(`... no ${pluginTypes[i]} plugin was defined in the config file.`)
    }
  }
  logger.info('')
}

/**
 * Validate microbs installation and configuration.
 */
module.exports.run = async () => {
  validateDependencies()
  validateConfig()
  await validatePlugins()
}
