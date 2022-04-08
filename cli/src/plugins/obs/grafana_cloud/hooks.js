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
 *
 */
const createAlertRules = async () => {
  logger.info(`Creating alert rules...`)

  // Load and parse alert rules
  const rules = {}
  glob.sync(path.join(context.get('homepath'), 'apps', config.get('deployment.app'), 'plugins', 'grafana_cloud', 'alerts', 'rules', '*.json')).forEach((filename) => {
    rules[filename] = utils.loadJson(filename)
  })
  for (var filename in rules) {
    logger.info(`Creating alert rule: ${filename}`)
    const data = rules[filename]
    const url = `${state.get('plugins.grafana_cloud.grafana.url')}/api/ruler/grafana/api/v1/rules/GrafanaCloud`
    logger.debug(`POST ${url}`)
    var response
    try {
      response = await axios.request({
        method: 'post',
        url: url,
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
    if (response.status == 200 || response.status == 202) {
      logger.info(`...created.`)
    } else {
      logger.error(`...failure.`)
      logger.error(response.data)
      process.exit(1)
    }
  }
}

/**
 *
 */
const destroyAlertRules = async () => {
  // TODO: Implement
}

/**
 * Create an alertmanager configuration (i.e. templates, receivers, route, and
 * notification policies) which is shown in the Grafana UI as "contact points."
 */
const createAlertContactPoints = async () => {
  logger.info(`Creating contact points...`)

  // Load and parse templates
  const templates = {}
  glob.sync(path.join(context.get('homepath'), 'apps', config.get('deployment.app'), 'plugins', 'grafana_cloud', 'alerts', 'templates', '*.txt')).forEach((filename) => {
    let name = path.parse(filename).name
    templates[name] = utils.loadFile(filename)
  })

  // Load and parse receivers
  const receivers = []
  glob.sync(path.join(context.get('homepath'), 'apps', config.get('deployment.app'), 'plugins', 'grafana_cloud', 'alerts', 'receivers', '*.json')).forEach((filename) => {
    receivers.push(utils.loadTemplateJson(filename))
  })

  // Load and parse route for the configured alerts plugin
  const routes = []
  glob.sync(path.join(context.get('homepath'), 'apps', config.get('deployment.app'), 'plugins', 'grafana_cloud', 'alerts', 'routes', '*.json')).forEach((filename) => {
    let name = path.parse(filename).name
    if (name == config.get('deployment.plugins.alerts'))
      routes.push(utils.loadJson(filename, config.get()))
  })

  const data = {
  	template_files: templates,
  	alertmanager_config: {
  		route: routes[0],
  		templates: Object.keys(templates),
  		receivers: receivers
  	}
  }
  console.log(data)

  // Create contact points
  const url = `${state.get('plugins.grafana_cloud.grafana.url')}/api/alertmanager/grafana/config/api/v1/alerts`
  logger.debug(`POST ${url}`)
  var response
  try {
    response = await axios.request({
      method: 'post',
      url: url,
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
  if (response.status == 200 || response.status == 202) {
    logger.info(`...created.`)
  } else {
    logger.error(`...failure.`)
    logger.error(response.data)
    process.exit(1)
  }
}

/**
 *
 */
const destroyAlertContactPoints = async () => {
// TODO: Implement
}

/**
 * Import a dashboard.
 */
const createDashboard = async (filepath) => {
  logger.info(`Creating dashboard: ${filepath}`)

  // Load and parse dashboard from file
  const dashboard = utils.loadJson(filepath)
  delete dashboard.id
  dashboard.uid = path.parse(filepath).name
  const data = {
    dashboard: dashboard,
    overwrite: true
  }

  // Import dashboard
  const url = `${state.get('plugins.grafana_cloud.grafana.url')}/api/dashboards/db`
  logger.debug(`POST ${url}`)
  var response
  try {
    response = await axios.request({
      method: 'post',
      url: url,
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
    logger.info(`...created: ${dashboard.uid}`)
  } else {
    logger.error(`...failure: ${dashboard.uid}`)
    logger.error(response.data)
    process.exit(1)
  }
}

/**
 * Destroy a dashboard.
 */
const destroyDashboard = async (filepath) => {
  logger.info(`Destroying dashboard: ${filepath}`)

  // Load and parse dashboard from file
  const uid = path.parse(filepath).name

  // Import dashboard
  const url = `${state.get('plugins.grafana_cloud.grafana.url')}/api/dashboards/uid/${uid}`
  logger.debug(`DELETE ${url}`)
  var response
  try {
    response = await axios.request({
      method: 'delete',
      url: url,
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
    logger.info(`...destroyed: ${uid}`)
  } else if (response.status == 404) {
    logger.info(`...not found: ${uid}`)
  } else {
    logger.error(`...failure: ${uid}`)
    logger.error(response.data)
    process.exit(1)
  }
}

/**
 * For each file in ./apps/APP/plugins/grafana_cloud/dashboards/*.json
 * invoke createDashboard()
 */
const onSetupApp = async () => {
  glob.sync(path.join(context.get('homepath'), 'apps', config.get('deployment.app'), 'plugins', 'grafana_cloud', 'dashboards', '*.json')).forEach(async (filepath) => {
    await createDashboard(filepath)
  })
  await createAlertRules()
  await createAlertContactPoints()
}

/**
 * For each file in ./apps/APP/plugins/grafana_cloud/dashboards/*.json
 * invoke destroyDashboard()
 */
const onDestroyApp = async () => {
  glob.sync(path.join(context.get('homepath'), 'apps', config.get('deployment.app'), 'plugins', 'grafana_cloud', 'dashboards', '*.json')).forEach(async (filepath) => {
    await destroyDashboard(filepath)
  })
  await destroyAlertRules()
  await destroyAlertContactPoints()
}

module.exports = {
  onDestroyApp: onDestroyApp,
  onSetupApp: onSetupApp
}
