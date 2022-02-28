// Standard packages
const process = require('process')
const { URL } = require('url')

// Third-party packages
const axios = require('axios')

// Main packages
const config = require('../../../config.js')
const state = require('../../../state.js')
const utils = require('../../../utils.js')

// Plugin packages
const constants = require('./constants.js')
const probe = require('./probe.js')
const rollout = require('./rollout.js')

/**
 * Validate configuration.
 */
const validate = () => {
  const requiredFields = [
    'deployment.name',
    'plugins.obs.grafana_cloud.api_key',
    'plugins.obs.grafana_cloud.org_slug',
  ]
  if (!utils.configHas(requiredFields)) {
    console.error()
    console.error(`You must set these variables in ${config.get('_context.filepath')} to setup Grafana Cloud:`)
    console.error()
    console.error(requiredFields)
    process.exit(1)
  }
}

module.exports = async () => {
  validate()

  // Check if 'deployment.name' exists on Grafana Cloud
  var stackExists = false
  if (state.get('plugins.obs.grafana_cloud.stack_id')) {
    console.log('')
    console.log(`Stack ID exists in .state file: ${state.get('plugins.obs.grafana_cloud.stack_id')}`)
    console.log('')
    console.log('Checking if the stack exists on Grafana Cloud...')
    stackExists = await probe.statusGrafanaCloud()
    if (stackExists)
      console.log(`...stack exists on Grafana Cloud: 'microbs-${config.get('deployment.name')}' [stack_id=${state.get('plugins.obs.grafana_cloud.stack_id')}, stack_slug=${state.get('plugins.obs.grafana_cloud.stack_slug')}]`)
    else
      console.log('...stack does not exist on Grafana Cloud. A new one will be created, and the .state file will be updated.')
  }

  // Create stack if it doesn't exist on Grafana Cloud
  if (!stackExists) {
    console.log('')
    console.log('Creating Grafana Cloud stack...')
    const data = {}
    data.name = `microbs-${config.get('deployment.name')}`
    data.slug = data.name.replace(/[^A-Za-z0-9]/g, '').toLowerCase()
    if (config.get('plugins.obs.grafana_cloud.region'))
      data.region = config.get('plugins.obs.grafana_cloud.region')
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
      console.debug(response.status)
      console.debug(response.data)
    } catch (err) {
      console.error(err.message)
    }

    // Get stack info
    if (response.status == 200) {
      console.log(`...created: 'microbs-${config.get('deployment.name')}' [stack_id=${response.data.id}, stack_slug=${response.data.slug}]`)
    } else {
      console.log('...failure:')
      console.log(JSON.stringify(response.data, null, indent=2))
      process.exit(1)
    }

    // Get deployment info and update .state file
    state.set('plugins.obs.grafana_cloud.stack_id', response.data.id)
    state.set('plugins.obs.grafana_cloud.stack_slug', response.data.slug)
    state.set('plugins.obs.grafana_cloud.grafana.url', response.data.url)
    state.set('plugins.obs.grafana_cloud.loki.endpoint', `${response.data.hlInstanceUrl}/api/prom/push`)
    state.set('plugins.obs.grafana_cloud.loki.url', response.data.hlInstanceUrl)
    state.set('plugins.obs.grafana_cloud.loki.username', response.data.hlInstanceId)
    state.set('plugins.obs.grafana_cloud.prometheus.endpoint', `${response.data.hmInstancePromUrl}/api/prom/push`)
    state.set('plugins.obs.grafana_cloud.prometheus.url', response.data.hmInstancePromUrl)
    state.set('plugins.obs.grafana_cloud.prometheus.username', response.data.hmInstancePromId)
    state.set('plugins.obs.grafana_cloud.tempo.endpoint', `${(new URL(response.data.htInstanceUrl)).hostname}:443`)
    state.set('plugins.obs.grafana_cloud.tempo.url', response.data.htInstanceUrl)
    state.set('plugins.obs.grafana_cloud.tempo.username', response.data.htInstanceId)
    state.save()

    console.log('')
    console.log('The Grafana Cloud deployment is ready.')
    console.log('')
    console.log(`Grafana URL:       ${state.get('plugins.obs.grafana_cloud.grafana.url')}`)
    console.log(`Loki URL:          ${state.get('plugins.obs.grafana_cloud.loki.url')}`)
    console.log(`  - Username:      ${state.get('plugins.obs.grafana_cloud.loki.username')}`)
    console.log(`Prometheus URL:    ${state.get('plugins.obs.grafana_cloud.prometheus.url')}`)
    console.log(`  - Username:      ${state.get('plugins.obs.grafana_cloud.prometheus.username')}`)
    console.log(`Tempo URL:         ${state.get('plugins.obs.grafana_cloud.tempo.url')}`)
    console.log(`  - Username:      ${state.get('plugins.obs.grafana_cloud.tempo.username')}`)
  }

  // Deploy the grafana-agent service to Kubernetes
  await rollout()
}
