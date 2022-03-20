// Third-party packages
const axios = require('axios')

// Main packages
const config = require('../../../config')
const context = require('../../../context')
const state = require('../../../state')
const utils = require('../../../utils')

// Plugin packages
const constants = require('./constants')
const rollout = require('./rollout')

/**
 * Validate configuration.
 */
const validate = () => {
  const requiredFields = [
    'plugins.grafana_cloud.api_key',
  ]
  if (!utils.configHas(requiredFields)) {
    console.error()
    console.error(`You must set these variables in ${config.get('filepath')} to destroy Grafana Cloud:`)
    console.error()
    console.error(requiredFields)
    process.exit(1)
  }
}

module.exports = async () => {
  validate()

  // Remove the grafana-agent service from Kubernetes
  await rollout({ action: 'delete' })

  // Destroy the Grafana Cloud stack
  if (!state.get('plugins.grafana_cloud.stack_slug'))
    return console.warn('There is no plugins.grafana_cloud.stack_slug to remove.')
  console.log('')
  console.log(`Removing Grafana Cloud deployment: 'microbs-${config.get('deployment.name')}' [stack_id=${state.get('plugins.grafana_cloud.stack_id')}, stack_slug=${state.get('plugins.grafana_cloud.stack_slug')}]`)
  var response
  try {
    response = await axios.request({
      method: 'delete',
      url: `https://grafana.com/api/instances/${state.get('plugins.grafana_cloud.stack_slug')}`,
      headers: constants.grafanaCloudApiHeaders(),
      timeout: 60000,
      validateStatus: () => true
    })
  } catch (err) {
    console.error(err.message)
  }
  if (response.status == 200) {
    state.set('plugins.grafana_cloud.stack_id', `${state.get('plugins.grafana_cloud.stack_id')}-destroyed`)
    state.set('plugins.grafana_cloud.stack_slug', `${state.get('plugins.grafana_cloud.stack_slug')}-destroyed`)
    state.save()
    console.log('...acknowledged. Grafana Cloud stack is destroyed.')
  } else if (response.status == 404) {
    console.log(`...Grafana could not find the stack. It might have been destroyed already.`)
  } else {
    console.debug(response.status)
    console.debug(response.data)
  }
}
