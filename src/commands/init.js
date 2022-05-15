/*
 * init.js
 * 
 * Create config path and config.yaml if they do not exist.
 */

// Standard packages
const fs = require('fs')
const os = require('os')
const path = require('path')

// Main packages
const { context, logger } = require('@microbs.io/core')

/**
 * Display the version of microbs as declared in package.json. 
 */
const run = () => {
  
  // Use $HOME/.microbs directory unless the user has specified a path to a
  // different config directory.
  logger.info('')
  logger.info('Initializing microbs config...')
  const pathConfig = context.get('args.config') || path.join(os.homedir(), '.microbs')
  logger.debug(`...chosen config path: ${pathConfig}`)
  if (!fs.existsSync(pathConfig)) {
    fs.mkdirSync(pathConfig)
    if (fs.existsSync(pathConfig))
      logger.info(`...created config path: ${pathConfig}`)
    else
      logger.error(`...failed to create config path: ${pathConfig}`)
  } else {
    logger.info(`...config path exists: ${pathConfig}`)
  }

  // Create config.yaml in config directory
  const pathConfigFile = path.join(pathConfig, 'config.yaml')
  if (!fs.existsSync(pathConfigFile)) {
    
    // Create config.yaml from config.reference.yaml
    const pathConfigRef = path.join(context.get('path.cli'), 'config.reference.yaml')
    const configRef = fs.readFileSync(pathConfigRef, 'utf8')
    const configNew = '# config.yaml\n#\n' + configRef.split(/\r?\n/).slice(5).join('\n')
    fs.writeFileSync(pathConfigFile, configNew, 'utf8')
    if (fs.existsSync(pathConfigFile))
      logger.info(`...created config file: ${pathConfigFile}`)
    else
      logger.error(`...failed to create config file: ${pathConfigFile}`)
  } else {
    logger.info(`...config file exists: ${pathConfigFile}`)
  }
  logger.info('')
}

module.exports.run = run
