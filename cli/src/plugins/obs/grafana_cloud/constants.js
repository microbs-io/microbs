/*
 * constants.js
 *
 * Constant values used throughout the plugin.
 */

// Standard packages
const path = require('path')

// Main packages
const config = require('../../../config.js')

/**
 * Absolute path to the directory of this plugin.
 */
module.exports.pluginHome = () => {
  return path.join(config.get('_context.homepath'), 'cli', 'src', 'plugins', 'obs', 'grafana_cloud')
}

/**
 * Shorthand for setting Grafana Cloud API headers.
 */
module.exports.grafanaCloudApiHeaders = (grafanaCloudApiKey) => {
  return {
    "Authorization": `Bearer ${grafanaCloudApiKey || config.get('plugins.obs.grafana_cloud.api_key')}`
  }
}
