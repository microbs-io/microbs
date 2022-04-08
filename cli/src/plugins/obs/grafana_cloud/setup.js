// Standard packages
const { URL } = require('url')

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
const probe = require('./probe')
const rollout = require('./rollout')

/**
 * Validate configuration.
 */
const validate = () => {
  const requiredFields = [
    'deployment.name',
    'plugins.grafana_cloud.api_key',
    'plugins.grafana_cloud.org_slug',
  ]
  if (!utils.configHas(requiredFields)) {
    logger.error()
    logger.error(`You must set these variables in ${context.get('filepath')} to setup Grafana Cloud:`)
    logger.error()
    logger.error(requiredFields)
    process.exit(1)
  }
}

module.exports = async () => {
  validate()

  // Check if 'deployment.name' exists on Grafana Cloud
  var stackExists = false
  if (state.get('plugins.grafana_cloud.stack_id')) {
    logger.info('')
    logger.info(`Stack ID exists in .state file: ${state.get('plugins.grafana_cloud.stack_id')}`)
    logger.info('')
    logger.info('Checking if the stack exists on Grafana Cloud...')
    stackExists = await probe.statusGrafanaCloud()
    if (stackExists)
      logger.info(`...stack exists on Grafana Cloud: 'microbs-${config.get('deployment.name')}' [stack_id=${state.get('plugins.grafana_cloud.stack_id')}, stack_slug=${state.get('plugins.grafana_cloud.stack_slug')}]`)
    else
      logger.info('...stack does not exist on Grafana Cloud. A new one will be created, and the .state file will be updated.')
  }

  // Create stack if it doesn't exist on Grafana Cloud
  if (!stackExists) {
    logger.info('')
    logger.info('Creating Grafana Cloud stack...')
    const data = {}
    data.name = `microbs-${config.get('deployment.name')}`
    data.slug = data.name.replace(/[^A-Za-z0-9]/g, '').toLowerCase()
    if (config.get('plugins.grafana_cloud.region'))
      data.region = config.get('plugins.grafana_cloud.region')
    var response
    try {
      response = await axios.request({
        method: 'post',
        url: 'https://grafana.com/api/instances',
        data: data,
        headers: constants.grafanaCloudApiHeaders(),
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
      logger.info(`...created: 'microbs-${config.get('deployment.name')}' [stack_id=${response.data.id}, stack_slug=${response.data.slug}]`)
    } else {
      logger.error('...failure:')
      logger.error(response.data)
      process.exit(1)
    }

    // Get deployment info and update .state file
    state.set('plugins.grafana_cloud.stack_id', response.data.id)
    state.set('plugins.grafana_cloud.stack_slug', response.data.slug)
    state.set('plugins.grafana_cloud.grafana.url', response.data.url)
    state.set('plugins.grafana_cloud.loki.endpoint', `${response.data.hlInstanceUrl}/api/prom/push`)
    state.set('plugins.grafana_cloud.loki.url', response.data.hlInstanceUrl)
    state.set('plugins.grafana_cloud.loki.username', response.data.hlInstanceId)
    state.set('plugins.grafana_cloud.prometheus.endpoint', `${response.data.hmInstancePromUrl}/api/prom/push`)
    state.set('plugins.grafana_cloud.prometheus.url', response.data.hmInstancePromUrl)
    state.set('plugins.grafana_cloud.prometheus.username', response.data.hmInstancePromId)
    state.set('plugins.grafana_cloud.tempo.endpoint', `${(new URL(response.data.htInstanceUrl)).hostname}:443`)
    state.set('plugins.grafana_cloud.tempo.url', response.data.htInstanceUrl)
    state.set('plugins.grafana_cloud.tempo.username', response.data.htInstanceId)
    state.save()

    // Create Grafana API Key
    //
    // This key is different from the Grafana Cloud API Key. It's used to manage
    // resources such as dashboards within the Grafana instance.
    logger.info('')
    logger.info('Creating Grafana API Key...')
    while (true) {
      var response
      try {
        response = await axios.request({
          method: 'post',
          url: `https://grafana.com/api/instances/${state.get('plugins.grafana_cloud.stack_slug')}/api/auth/keys`,
          data: {
            name: 'microbs',
            role: 'Admin'
          },
          headers: constants.grafanaCloudApiHeaders(),
          timeout: 60000,
          validateStatus: () => true
        })
        logger.debug(response.status)
        logger.debug(response.data)
      } catch (err) {
        logger.error(err.message)
      }

      if (response.status == 503 && response.data.code == 'Loading') {
        await utils.sleep(1000)
        continue
      }

      // Get stack info
      if (response.status == 200) {
        logger.info('...created.')
        state.set('plugins.grafana_cloud.grafana_api_key', response.data.key)
        break
      } else if (response.status == 409 && response.data.message.includes('must be unique')) {
        logger.info('...exists.')
        break
      } else {
        logger.error('...failure:')
        logger.error(response.data)
        process.exit(1)
      }
    }
  }

  // Deploy the grafana-agent service to Kubernetes
  await rollout()
}
