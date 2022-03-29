/*
 * apps.js
 *
 * Manage resources that applications specify in their respective
 * ./apps/APP_NAME/plugins directories.
 */

// Standard packages
const glob = require('glob')
const path = require('path')

// Third-party packages
const axios = require('axios')

// Main packages
const config = require('../../../config')
const context = require('../../../context')
const logger = require('../../../logger')
const state = require('../../../state')
const utils = require('../../../utils')

// Plugin packages
const constants = require('./constants')

/**
 * Import a dashboard.
 */
const importDashboard = async (filepath) => {
  logger.info(`Importing Grafana dashboard: ${filepath}`)

  // Load and parse dashboard from file
  const dashboard = utils.loadJson(filepath)
  delete dashboard.id
  dashboard.uid = path.parse(filepath).name
  const data = {
    dashboard: dashboard,
    overwrite: true
  }

  // Import dashboard
  logger.debug(`POST ${state.get('plugins.grafana_cloud.grafana.url')}/api/dashboards/db`)
  var response
  try {
    response = await axios.request({
      method: 'post',
      url: `${state.get('plugins.grafana_cloud.grafana.url')}/api/dashboards/db`,
      data: data,
      headers: constants.grafanaApiHeaders(),
      timeout: 60000,
      validateStatus: () => true
    })
    logger.debug(response.status)
    logger.debug(response.data)
  } catch (err) {
    logger.error(err.message)
  }

  // Get stack info
  if (response.status == 200) {
    logger.info(`...imported: ${dashboard.uid}`)
  } else {
    logger.info(`...failure: ${dashboard.uid}`)
    logger.info(JSON.stringify(response.data, null, indent=2))
    process.exit(1)
  }
}

/**
 * Delete a dashboard.
 */
const deleteDashboard = async (filepath) => {
  logger.info(`Deleting Grafana dashboard: ${filepath}`)

  // Load and parse dashboard from file
  const uid = path.parse(filepath).name

  // Import dashboard
  logger.debug(`DELETE ${state.get('plugins.grafana_cloud.grafana.url')}/api/dashboards/uid/${uid}`)
  var response
  try {
    response = await axios.request({
      method: 'delete',
      url: `${state.get('plugins.grafana_cloud.grafana.url')}/api/dashboards/uid/${uid}`,
      headers: constants.grafanaApiHeaders(),
      timeout: 60000,
      validateStatus: () => true
    })
    logger.debug(response.status)
    logger.debug(response.data)
  } catch (err) {
    logger.error(err.message)
  }

  // Get stack info
  if (response.status == 200) {
    logger.info(`...deleted: ${uid}`)
  } else if (response.status == 404) {
    logger.info(`...not found: ${uid}`)
  } else {
    logger.info(`...failure: ${uid}`)
    logger.info(JSON.stringify(response.data, null, indent=2))
    process.exit(1)
  }
}

/**
 * For each file in ./apps/APP/plugins/grafana_cloud/dashboards/*.json
 * invoke importDashboard()
 */
const onSetupApp = async () => {
  glob.sync(path.join(context.get('homepath'), 'apps', config.get('deployment.app'), 'plugins', 'grafana_cloud', 'dashboards', '*.json')).forEach((filepath) => {
    importDashboard(filepath)
  })
}

/**
 * For each file in ./apps/APP/plugins/grafana_cloud/dashboards/*.json
 * invoke deleteDashboard()
 */
const onDestroyApp = async () => {
  glob.sync(path.join(context.get('homepath'), 'apps', config.get('deployment.app'), 'plugins', 'grafana_cloud', 'dashboards', '*.json')).forEach((filepath) => {
    deleteDashboard(filepath)
  })
}

module.exports = {
  onDestroyApp: onDestroyApp,
  onSetupApp: onSetupApp
}
