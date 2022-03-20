/*
 * constants.js
 *
 * Constant values used throughout the plugin.
 */

// Standard packages
const path = require('path')

// Main packages
const config = require('../../../config')
const context = require('../../../context')

/**
 * Absolute path to the directory of this plugin.
 */
module.exports.pluginHome = () => {
  return path.join(config.get('homepath'), 'cli', 'src', 'plugins', 'obs', 'elastic_cloud')
}

/**
 * Shorthand for setting Elastic Cloud API headers.
 */
module.exports.elasticCloudApiHeaders = (elasticCloudApiKey) => {
  return {
    "Authorization": `ApiKey ${elasticCloudApiKey || config.get('plugins.elastic_cloud.api_key')}`
  }
}
