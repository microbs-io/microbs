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
  return path.join(config.get('homepath'), 'cli', 'src', 'plugins', 'obs', 'grafana_cloud')
}

/**
 * Shorthand for setting Grafana Cloud API headers.
 */
module.exports.grafanaCloudApiHeaders = (grafanaCloudApiKey) => {
  return {
    "Authorization": `Bearer ${grafanaCloudApiKey || config.get('plugins.grafana_cloud.api_key')}`
  }
}
