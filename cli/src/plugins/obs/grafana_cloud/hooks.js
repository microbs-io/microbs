// Standard packages
const glob = require('glob')
const path = require('path')

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
  var response
  try {
    response = await utils.http({
      method: 'get',
      url: `${state.get('plugins.grafana_cloud.grafana.url')}/api/ruler/grafana/api/v1/rules`,
      headers: constants.grafanaApiHeaders()
    })
  } catch (err) {
    logger.error(err)
    return
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
      var response
      try {
        response = await utils.http({
          method: 'delete',
          url: url,
          headers: constants.grafanaApiHeaders()
        })
      } catch (err) {
        logger.error(err)
        return
      }
    }
    logger.info(`Creating alert rule: ${filename}`)
    const data = rules[filename]
    const url = `${state.get('plugins.grafana_cloud.grafana.url')}/api/ruler/grafana/api/v1/rules/GrafanaCloud`
    var response
    try {
      response = await utils.http({
        method: 'post',
        url: url,
        data: data,
        headers: constants.grafanaApiHeaders()
      })
    } catch (err) {
      logger.error(err)
      return
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
  var response
  try {
    response = await utils.http({
      method: 'get',
      url: `${state.get('plugins.grafana_cloud.grafana.url')}/api/ruler/grafana/api/v1/rules`,
      headers: constants.grafanaApiHeaders()
    })
  } catch (err) {
    logger.error(err)
    return
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
      var response
      try {
        response = await utils.http({
          method: 'delete',
          url: url,
          headers: constants.grafanaApiHeaders()
        })
      } catch (err) {
        logger.error(err)
        return
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
  var response
  try {
    response = await utils.http({
      method: 'post',
      url: url,
      headers: constants.grafanaApiHeaders(),
      data: data
    })
  } catch (err) {
    logger.error(err)
    return
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
  var response
  try {
    response = await utils.http({
      method: 'delete',
      url: url,
      headers: constants.grafanaApiHeaders()
    })
  } catch (err) {
    logger.error(err)
    return
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
  var response
  try {
    response = await utils.http({
      method: 'post',
      url: url,
      headers: constants.grafanaApiHeaders(),
      data: data
    })
  } catch (err) {
    logger.error(err)
    return
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
  var response
  try {
    response = await utils.http({
      method: 'delete',
      url: url,
      headers: constants.grafanaApiHeaders()
    })
  } catch (err) {
    logger.error(err)
    return
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

const getSyntheticMonitoringChecks = async () => {
  const url = `${state.get('plugins.grafana_cloud.grafana.url')}/api/datasources/proxy/21/sm/check/list`
  var response
  try {
    response = await utils.http({
      method: 'get',
      url: url,
      headers: constants.grafanaApiHeaders()
    })
  } catch (err) {
    logger.error(err)
    return
  }
  if (response.status == 200 && response.data)
    return response.data
  else
    logger.error('...failed to list synthetic monitoring checks.')
}

/**
 * Create synthetic monitoring check.
 */
const createSyntheticMonitoringCheck = async (filepath) => {
  logger.info(`Creating synthetic monitoring check: ${filepath}`)

  // Load and parse synthetic monitoring check from file
  const data = utils.loadJson(filepath) 
  delete data.probes
  data.probes = [ state.get('plugins.grafana_cloud.synthetic_monitoring.probe.id') ]
  const url = `${state.get('plugins.grafana_cloud.grafana.url')}/api/datasources/proxy/21/sm/check/add`
  var response
  try {
    response = await utils.http({
      method: 'post',
      url: url,
      headers: constants.grafanaApiHeaders(),
      data: data
    })
  } catch (err) {
    logger.error(err)
    return
  }
  if (response.status == 200)
    logger.info(`...created: ${filepath}`)
  else if (response.status == 409)
    logger.info(`...exists: ${filepath}`)
  else
    logger.info(`...failure: ${filepath}`)
}

/**
 * Create synthetic monitoring checks.
 */
const createSyntheticMonitoringChecks = async () => {
  glob.sync(path.join(context.get('homepath'), 'apps', config.get('deployment.app'), 'plugins', 'grafana_cloud', 'synthetic-monitoring', '*.json')).forEach(async (filepath) => {
    await createSyntheticMonitoringCheck(filepath)
  })
}

const destroySyntheticMonitoringCheck = async (filepath, checks) => {
  logger.info(`Removing synthetic monitoring check: ${filepath}`)
  
  // Load and parse synthetic monitoring check from file
  const checkName = utils.loadJson(filepath).job
  var checkId
  for (var i in checks) {
    if (checkName == checks[i].job) {
      checkId = checks[i].id
      break
    }
  }
  if (!checkId) {
    logger.info(`...check does not exist: ${filepath}`)
    return
  }
  const url = `${state.get('plugins.grafana_cloud.grafana.url')}/api/datasources/proxy/21/sm/check/delete/${checkId}`
  var response
  try {
    response = await utils.http({
      method: 'delete',
      url: url,
      headers: constants.grafanaApiHeaders()
    })
  } catch (err) {
    logger.error(err)
    return
  }
  if (response.status == '200') {
    logger.info(`...deleted check: ${filepath}`)
  } else {
    logger.error('...failure:')
    logger.error(response.data)
  }
}

/**
 * Remove the synthetic monitoring checks.
 */
const destroySyntheticMonitoringChecks = async () => {
  const checks = await getSyntheticMonitoringChecks()
  glob.sync(path.join(context.get('homepath'), 'apps', config.get('deployment.app'), 'plugins', 'grafana_cloud', 'synthetic-monitoring', '*.json')).forEach(async (filepath) => {
    await destroySyntheticMonitoringCheck(filepath, checks)
  })
}

/**
 * When the application is setup, create synthetic monitoring checks and invoke
 * createDashboard() for each file in ./apps/APP/plugins/grafana_cloud/dashboards/*.json.
 */
const after_setup_app = async () => {
  await createSyntheticMonitoringChecks()
  glob.sync(path.join(context.get('homepath'), 'apps', config.get('deployment.app'), 'plugins', 'grafana_cloud', 'dashboards', '*.json')).forEach(async (filepath) => {
    await createDashboard(filepath)
  })
}

/**
 * When the application is destroyed, invoke destroyDashboard() for each file in 
 * ./apps/APP/plugins/grafana_cloud/dashboards/*.json and destroy synthetic
 * monitoring checks.
 */
const after_destroy_app = async () => {
  glob.sync(path.join(context.get('homepath'), 'apps', config.get('deployment.app'), 'plugins', 'grafana_cloud', 'dashboards', '*.json')).forEach(async (filepath) => {
    await destroyDashboard(filepath)
  })
  await destroySyntheticMonitoringChecks()
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
