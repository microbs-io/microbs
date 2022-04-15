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
 * Create alert rules.
 */
const createAlertRules = async () => {
  logger.info(`Creating alert rules...`)
  
  // Fetch any existing rules 
  logger.debug('Getting existing alerts...')
  logger.debug(`GET ${state.get('plugins.grafana_cloud.grafana.url')}/api/ruler/grafana/api/v1/rules`)
  var response
  try {
    response = await axios.request({
      method: 'get',
      url: `${state.get('plugins.grafana_cloud.grafana.url')}/api/ruler/grafana/api/v1/rules`,
      headers: constants.grafanaApiHeaders(),
      timeout: 60000,
      validateStatus: () => true
    })
    logger.debug(response.status)
    logger.debug(response.data)
  } catch (err) {
    logger.error(err.message)
  }
  const rulesExisting = {}
  if (response.data.GrafanaCloud) {
    for (var i in response.data.GrafanaCloud) {
      const rule = response.data.GrafanaCloud[i]
      const name = rule.name
      rulesExisting[name] = rule
    }
  }

  // Load and parse alert rules
  const rules = {}
  glob.sync(path.join(context.get('homepath'), 'apps', config.get('deployment.app'), 'plugins', 'grafana_cloud', 'alerts', 'rules', '*.json')).forEach((filename) => {
    rules[filename] = utils.loadJson(filename)
  })
  for (var filename in rules) {
    if (rulesExisting[rules[filename].name]) {
      logger.info(`Deleting old alert rule: ${rules[filename].name}`)
      const url = `${state.get('plugins.grafana_cloud.grafana.url')}/api/ruler/grafana/api/v1/rules/GrafanaCloud/${rules[filename].name}`
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
    }
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
 * Destroy alert rules.
 */
const destroyAlertRules = async () => {
  logger.info(`Destroying alert rules...`)
  
  // Fetch any existing rules 
  logger.debug('Getting existing alerts...')
  logger.debug(`GET ${state.get('plugins.grafana_cloud.grafana.url')}/api/ruler/grafana/api/v1/rules`)
  var response
  try {
    response = await axios.request({
      method: 'get',
      url: `${state.get('plugins.grafana_cloud.grafana.url')}/api/ruler/grafana/api/v1/rules`,
      headers: constants.grafanaApiHeaders(),
      timeout: 60000,
      validateStatus: () => true
    })
    logger.debug(response.status)
    logger.debug(response.data)
  } catch (err) {
    logger.error(err.message)
  }
  const rulesExisting = {}
  if (response.data.GrafanaCloud) {
    for (var i in response.data.GrafanaCloud) {
      const rule = response.data.GrafanaCloud[i]
      const name = rule.name
      rulesExisting[name] = rule
    }
  }

  // Load and parse alert rules
  const rules = {}
  glob.sync(path.join(context.get('homepath'), 'apps', config.get('deployment.app'), 'plugins', 'grafana_cloud', 'alerts', 'rules', '*.json')).forEach((filename) => {
    rules[filename] = utils.loadJson(filename)
  })
  for (var filename in rules) {
    if (rulesExisting[rules[filename].name]) {
      logger.info(`Deleting alert rule: ${rules[filename].name}`)
      const url = `${state.get('plugins.grafana_cloud.grafana.url')}/api/ruler/grafana/api/v1/rules/GrafanaCloud/${rules[filename].name}`
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
    }
  }
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
    receivers.push(utils.loadTemplateJson(filename, config.get()))
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
  if (response.status == 200 || response.status == 202) {
    logger.info(`...created.`)
  } else {
    logger.error(`...failure.`)
    logger.error(response.data)
    process.exit(1)
  }
}

/**
 * Reset the alerting configuration to its default on Grafana Cloud.
 */
const destroyAlertContactPoints = async () => {
  logger.info(`Destroying alert configuration...`)

  // Destroy alerting configuration
  const url = `${state.get('plugins.grafana_cloud.grafana.url')}/api/alertmanager/grafana/config/api/v1/alerts`
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
  if (response.status == 200 || response.status == 202) {
    logger.info(`...destroyed.`)
  } else {
    logger.error(`...failure.`)
    logger.error(response.data)
    process.exit(1)
  }
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
 * When the application is setup, invoke createDashboard() for each file in
 * ./apps/APP/plugins/grafana_cloud/dashboards/*.json.
 */
const after_setup_app = async () => {
  glob.sync(path.join(context.get('homepath'), 'apps', config.get('deployment.app'), 'plugins', 'grafana_cloud', 'dashboards', '*.json')).forEach(async (filepath) => {
    await createDashboard(filepath)
  })
}

/**
 * When the application is destroyed, invoke destroyDashboard() for each file in 
 * ./apps/APP/plugins/grafana_cloud/dashboards/*.json.
 */
const after_destroy_app = async () => {
  glob.sync(path.join(context.get('homepath'), 'apps', config.get('deployment.app'), 'plugins', 'grafana_cloud', 'dashboards', '*.json')).forEach(async (filepath) => {
    await destroyDashboard(filepath)
  })
}

/**
 * When rolling out a variant, setup alerts.
 * When rolling back to the "main" profile, destroy alerts.
 */
const after_rollout = async () => {
  const args = context.get('args')
  if (args._.length === 1) {
    // A named variant is rolling out. Setup alerts.
    await createAlertRules()
    await createAlertContactPoints()
  } else if (args._.length === 0 || args._[0] == 'main') {
    // The "main" profile is rolling out. Destroy alerts.
    await destroyAlertRules()
    await destroyAlertContactPoints()
  }
}

module.exports = {
  after_destroy_app: after_destroy_app,
  after_setup_app: after_setup_app,
  after_rollout: after_rollout
}
