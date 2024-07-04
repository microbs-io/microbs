// Standard packages
const fs = require('fs')
const path = require('path')

// Third-party packages
const chalk = require('chalk')
const semver = require('semver')

// Main packages
const { config, context, logger, utils } = require('@microbs.io/core')
const apps = require('./apps')
const plugins = require('./plugins')

const logSuccess = (msg) => logger.info(`${chalk.bold.greenBright('✓')} ${chalk.dim(msg)}`)
const logInfo = (msg) => logger.warn(`${chalk.bold.cyanBright('i')} ${msg}`)
const logFailure = (msg) => logger.error(`${chalk.bold.redBright('⨯')} ${msg}`)
const logUnknown = (msg) => logger.warn(`${chalk.bold.yellowBright('?')} ${msg}`)
module.exports.logSuccess = logSuccess
module.exports.logFailure = logFailure
module.exports.logUnknown = logUnknown

/**
 * Validate Node.js version
 */
const validateNodeVersion = () => {
  const nvmrcFilepath = path.resolve(context.get('path.cli'), '.nvmrc')
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
 * Validate npm installation
 */
const validateNpmInstallation = () => {
  const result = utils.exec('npm help', true)
  if(result.code === 0)
    logSuccess('npm is installed')
  else
    logFailure('npm is not installed')
}

/**
 * Validate npm version
 */
const validateNpmVersion = () => {
  const result = utils.exec('npm version --json', true)
  if (result.stdout) {
    try {
      const json = JSON.parse(result.stdout.trim())
      const versionActual = semver.clean(json.npm)
      const versionRequired = semver.clean('8.3.0')
      if (semver.gte(versionActual, versionRequired))
        logSuccess(`npm is correct version [using=${versionActual}, required>=${versionRequired}]`)
      else
        logFailure(`npm is incorrect version [using=${versionActual}, required>=${versionRequired}]`)
    } catch (e) {
      logger.error(e)
    }
  } else {
    logger.warn(result.stderr)
  }
}

/**
 * Validate docker installation
 */
const validateDockerInstallation = () => {
  const result = utils.exec('docker --help', true)
  if(result.code === 0)
    logSuccess('docker is installed')
  else
    logFailure('docker is not installed')
}

/**
 * Validate docker version
 */
const validateDockerVersion = () => {
  const result = utils.exec("docker version --format '{{json .}}'", true)
  if (result.stdout) {
    try {
      // The first line(s) may be a warning message. Find the line that is JSON.
      const lines = result.stdout.split(/\r?\n/)
      var line
      for (var i in lines) {
        if (lines[i].startsWith('{')) {
          line = lines[i]
          break
        }
      }
      const versionRequired = semver.clean('20.10.0')
      if (!line)
        return logUnknown(`failed to detect docker version [required>=${versionRequired}]`)
      var json
      try {
        json = JSON.parse(line.trim())
      } catch (e) {
        return logUnknown(`failed to detect docker version [required>=${versionRequired}]`)
      }
      const versionActual = semver.clean(json.Client.Version)
      if (semver.gte(versionActual, versionRequired))
        logSuccess(`docker is correct version [using=${versionActual}, required>=${versionRequired}]`)
      else
        logFailure(`docker is incorrect version [using=${versionActual}, required>=${versionRequired}]`)
    } catch (e) {
      logger.error(e)
    }
  } else {
    logger.warn(result.stderr)
  }
}

/**
 * Validate docker running
 */
const validateDockerRunning = () => {
  const result = utils.exec('docker ps -q', true)
  if(result.code === 0)
    logSuccess('docker is running')
  else
    logFailure(`docker is not running: ${result.stdout || result.stderr}`)
}

/**
 * Validate kubectl installation
 */
const validateKubectlInstallation = () => {
  const result = utils.exec('kubectl --help', true)
  if(result.code === 0)
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
      const versionActual = semver.clean(result.stdout.match(/Client Version: v(\d+\.\d+\.\d+)/)[1])
      const versionRequired = semver.clean('1.23.0')
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
  const result = utils.exec('skaffold --help', true)
  if(result.code === 0)
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
      const versionActual = semver.clean(result.stdout)
      const versionRequired = semver.clean('1.36.0')
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
    logSuccess(`config file exists: ${context.get('path.config')}`)
  } catch (e) {
    logFailure(`config file does not exist: ${context.get('path.config')}`)
    return false
  }
  return true
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
    return false
  }
  return true
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
    'deployment.plugins.kubernetes',
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
    'deployment.plugins.observability',
    'otlp.receiver.host',
    'otlp.receiver.port',
  ]
  for (var i in requiredNormally)
    if (!config.get(requiredNormally[i]))
      logInfo(`'${requiredNormally[i]}' is normally required but missing from config.`)

  // Validate specific values
  if (config.get('otlp.receiver.port')) {
    if (!config.get('otlp.receiver.port').toString().match(/^[0-9]+$/)) {
      hasErrors = true
      logFailure(`'otlp.receiver.port' expected an integer but found: ${config.get('otlp.receiver.port')}`)
    }
  }
  return true
}

/**
 * Validate software dependencies of microbs.
 */
const validateDependencies = () => {
  logger.info('')
  logger.info('Validating dependencies...')
  validateNodeVersion()
  validateNpmInstallation()
  validateNpmVersion()
  validateDockerInstallation()
  validateDockerVersion()
  validateDockerRunning()
  validateKubectlInstallation()
  validateKubectlVersion()
  validateSkaffoldInstallation()
  validateSkaffoldVersion()
}

const validateConfig = () => {
  logger.info('')
  logger.info('Validating config...')
  const exists = validateConfigExists()
  if (!exists)
    return
  const syntax = validateConfigSyntax()
  if (!syntax)
    return
  validateConfigValues()
  return true
}

const validateApps = async () => {
  logger.info('')
  logger.info('Validating apps...')
  var hasErrors = false
  const appName = config.get(`deployment.app`)
  if (!appName) {
    logUnknown(`'deployment.apps' does not name a plugin.`)
  } else {
    try {
      const appsInstalled = apps.getInstalledApps()
      if(!appsInstalled[`@microbs.io/app-${appName}`]) {
        hasErrors = true
        logFailure(`'deployment.apps' does not name an installed app: ${appName}`)
      }
    } catch (e) {
      hasErrors = true
      logFailure(e)
    }
  }
  if (!hasErrors)
    logSuccess('no problems detected in apps.')
}

const validatePlugins = async () => {
  logger.info('')
  logger.info('Validating plugins...')
  var hasErrors = false
  const pluginTypes = [ 'kubernetes', 'observability', 'alerts' ]
  for (var i in pluginTypes) {
    const pluginName = config.get(`deployment.plugins.${pluginTypes[i]}`)
    if (!pluginName) {
      logUnknown(`'deployment.plugins.${pluginTypes[i]}' does not name a plugin.`)
      continue
    }
    try {
      const pluginsInstalled = require(`@microbs.io/plugin-${pluginName}`)
    } catch (e) {
      hasErrors = true
      logFailure(`'deployment.plugins.${pluginTypes[i]}' does not name an installed plugin: ${pluginName}`)
      continue
    }
    var plugin = require(`@microbs.io/plugin-${pluginName}`)
    if (plugin) {
      if (plugin.validate) {
        const results = await plugin.validate()
        for (var i in results)
          results[i].success ? logSuccess(results[i].message) : logFailure(results[i].message)
      } else {
        logger.debug(`... the '${pluginName}' ${pluginTypes[i]} plugin does not implement the 'validate' command.`)
      }
    } else {
      logger.debug(`... no ${pluginTypes[i]} plugin was defined in the config file.`)
    }
  }
}

/**
 * Validate microbs installation and configuration.
 */
const run = async () => {
  validateDependencies()
  if (validateConfig()) {
    await validatePlugins()
    await validateApps()
  }
  logger.info('')
}

module.exports = {
  validateDependencies: validateDependencies,
  validateConfig: validateConfig,
  validatePlugins: validatePlugins,
  validateApps: validateApps,
  run: run
}
